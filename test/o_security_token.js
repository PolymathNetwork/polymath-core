import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployCappedSTOAndVerifyed } from "./helpers/createInstances";

const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("SecurityToken", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_affiliate1;
    let account_affiliate2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;
    let account_controller;
    let address_zero = "0x0000000000000000000000000000000000000000";

    let balanceOfReceiver;
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let ID_snap;
    const message = "Transaction Should Fail!!";

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
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_CappedSTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    let snap_Id;
    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = "FLAGS";
    const TM_Perm_Whitelist = "WHITELIST";

    // Capped STO details
    let startTime;
    let endTime;
    const cap = web3.utils.toWei("10000");
    const rate = 1000;
    const fundRaiseType = [0];
    const cappedSTOSetupCost = web3.utils.toWei("20000", "ether");
    const maxCost = cappedSTOSetupCost;
    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_affiliate1 = accounts[2];
        account_affiliate2 = accounts[3];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_investor2 = accounts[6];
        account_investor3 = accounts[7];
        account_temp = accounts[8];
        account_investor1 = accounts[9];

        token_owner = account_issuer;
        account_controller = account_temp;

        // Step:1 Create the polymath ecosystem contract instances
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
        [I_CappedSTOFactory] = await deployCappedSTOAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, cappedSTOSetupCost);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            console.log(log.args);
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

            assert.notEqual(I_GeneralTransferManager.address.valueOf(), address_zero, "GeneralTransferManager contract was not deployed");
        });

        it("Should mint the tokens before attaching the STO -- fail only be called by the owner", async () => {
            let fromTime = latestTime();
            let toTime = fromTime + duration.days(100);
            let expiryTime = toTime + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyWhitelist(account_affiliate1, fromTime, toTime, expiryTime, true, {
                from: token_owner,
                gas: 6000000
            });
            assert.equal(tx.logs[0].args._investor, account_affiliate1, "Failed in adding the investor in whitelist");
            await catchRevert(I_SecurityToken.mint(account_investor1, 100 * Math.pow(10, 18), { from: account_delegate }));
        });

        it("Should mint the tokens before attaching the STO", async () => {
            await I_SecurityToken.mint(account_affiliate1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 });
            let balance = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });

        it("Should mint the multi tokens before attaching the STO -- fail only be called by the owner", async () => {
            let fromTime = latestTime();
            let toTime = fromTime + duration.days(100);
            let expiryTime = toTime + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyWhitelist(account_affiliate2, fromTime, toTime, expiryTime, true, {
                from: token_owner,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_affiliate2, "Failed in adding the investor in whitelist");
            await catchRevert(
                I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [100 * Math.pow(10, 18), 110 * Math.pow(10, 18)], {
                    from: account_delegate,
                    gas: 500000
                })
            );
        });

        it("Should mintMulti", async () => {
            await catchRevert(
                I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [100 * Math.pow(10, 18)], {
                    from: token_owner,
                    gas: 500000
                })
            );
        });

        it("Should mint the tokens for multiple afiliated investors before attaching the STO", async () => {
            await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [100 * Math.pow(10, 18), 110 * Math.pow(10, 18)], {
                from: token_owner,
                gas: 500000
            });
            let balance1 = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(), 200);
            let balance2 = await I_SecurityToken.balanceOf(account_affiliate2);
            assert.equal(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(), 110);
        });

        it("Should finish the minting -- fail because feature is not activated", async () => {
            await catchRevert(I_SecurityToken.freezeMinting({ from: token_owner }));
        });

        it("Should finish the minting -- fail to activate the feature because msg.sender is not polymath", async () => {
            await catchRevert(I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, { from: token_owner }));
        });

        it("Should finish the minting -- successfully activate the feature", async () => {
            await catchRevert(I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", false, { from: account_polymath }));

            assert.equal(false, await I_FeatureRegistry.getFeatureStatus("freezeMintingAllowed", { from: account_temp }));
            await I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, { from: account_polymath });
            assert.equal(true, await I_FeatureRegistry.getFeatureStatus("freezeMintingAllowed", { from: account_temp }));

            await catchRevert(I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, { from: account_polymath }));
        });

        it("Should finish the minting -- fail because msg.sender is not the owner", async () => {
            await catchRevert(I_SecurityToken.freezeMinting({ from: account_temp }));
        });

        it("Should finish minting & restrict the further minting", async () => {
            let id = await takeSnapshot();
            await I_SecurityToken.freezeMinting({ from: token_owner });

            await catchRevert(I_SecurityToken.mint(account_affiliate1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 }));
            await revertToSnapshot(id);
        });

        it("Should fail to attach the STO factory because not enough poly in contract", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

            await catchRevert(I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner }));
        });

        it("Should fail to attach the STO factory because max cost too small", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: token_owner });

            await catchRevert(
                I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, web3.utils.toWei("1000", "ether"), 0, { from: token_owner })
            );
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: token_owner });

            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.toUtf8(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
            I_CappedSTO = CappedSTO.at(tx.logs[3].args._module);
        });

        it("Should successfully mint tokens while STO attached", async () => {
            await I_SecurityToken.mint(account_affiliate1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 });
            let balance = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 300);
        });

        it("Should fail to mint tokens while STO attached after freezeMinting called", async () => {
            let id = await takeSnapshot();
            await I_SecurityToken.freezeMinting({ from: token_owner });

            await catchRevert(I_SecurityToken.mint(account_affiliate1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 }));
            await revertToSnapshot(id);
        });
    });

    describe("Module related functions", async () => {
        it("Should get the modules of the securityToken by index", async () => {
            let moduleData = await I_SecurityToken.getModule.call(I_CappedSTO.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
            assert.equal(moduleData[2], I_CappedSTOFactory.address);
            assert.equal(moduleData[3], false);
            assert.equal(moduleData[4][0], 3);
        });

        it("Should get the modules of the securityToken by index (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModule.call(token_owner);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "");
            assert.equal(moduleData[1], address_zero);
        });

        it("Should get the modules of the securityToken by name", async () => {
            let moduleList = await I_SecurityToken.getModulesByName.call("CappedSTO");
            assert.isTrue(moduleList.length == 1, "Only one STO");
            let moduleData = await I_SecurityToken.getModule.call(moduleList[0]);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModulesByName.call("GeneralPermissionManager");
            assert.isTrue(moduleData.length == 0, "No Permission Manager");
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModulesByName.call("CountTransferManager");
            assert.isTrue(moduleData.length == 0, "No Permission Manager");
        });

        it("Should fail in updating the token details", async () => {
            await catchRevert(I_SecurityToken.updateTokenDetails("new token details", { from: account_delegate }));
        });

        it("Should update the token details", async () => {
            let log = await I_SecurityToken.updateTokenDetails("new token details", { from: token_owner });
            assert.equal(log.logs[0].args._newDetails, "new token details");
        });

        it("Should successfully remove the general transfer manager module from the securityToken -- fails msg.sender should be Owner", async () => {
            await catchRevert(I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from: token_owner }));
        });

        it("Should fail to remove the module - module not archived", async () => {
            await catchRevert(I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from: account_temp }));
        });

        it("Should fail to remove the module - incorrect address", async () => {
            await catchRevert(I_SecurityToken.removeModule(0, { from: token_owner }));
        });

        it("Should successfully remove the general transfer manager module from the securityToken", async () => {
            let key = await takeSnapshot();
            await I_SecurityToken.archiveModule(I_GeneralTransferManager.address, { from: token_owner });
            let tx = await I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from: token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            await revertToSnapshot(key);
        });

        it("Should verify the revertion of snapshot works properly", async () => {
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
        });

        it("Should successfully archive the general transfer manager module from the securityToken", async () => {
            let tx = await I_SecurityToken.archiveModule(I_GeneralTransferManager.address, { from: token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
            assert.equal(moduleData[2], I_GeneralTransferManagerFactory.address);
            assert.equal(moduleData[3], true);
        });

        it("Should successfully mint tokens while GTM archived", async () => {
            let key = await takeSnapshot();
            await I_SecurityToken.mint(1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 });
            let balance = await I_SecurityToken.balanceOf(1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            await revertToSnapshot(key);
        });

        it("Should successfully unarchive the general transfer manager module from the securityToken", async () => {
            let tx = await I_SecurityToken.unarchiveModule(I_GeneralTransferManager.address, { from: token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ""), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
            assert.equal(moduleData[2], I_GeneralTransferManagerFactory.address);
            assert.equal(moduleData[3], false);
        });

        it("Should fail to mint tokens while GTM unarchived", async () => {
            await catchRevert(I_SecurityToken.mint(1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 }));
        });

        it("Should change the budget of the module - fail incorrect address", async () => {
            await catchRevert(I_SecurityToken.changeModuleBudget(0, 100 * Math.pow(10, 18), { from: token_owner }));
        });

        it("Should change the budget of the module", async () => {
            let tx = await I_SecurityToken.changeModuleBudget(I_CappedSTO.address, 100 * Math.pow(10, 18), { from: token_owner });
            assert.equal(tx.logs[1].args._moduleTypes[0], stoKey);
            assert.equal(tx.logs[1].args._module, I_CappedSTO.address);
            assert.equal(tx.logs[1].args._budget.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });
    });

    describe("General Transfer manager Related test cases", async () => {
        it("Should Buy the tokens", async () => {
            balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
            // Add the Investor in to the whitelist

            fromTime = latestTime();
            toTime = fromTime + duration.days(100);
            expiryTime = toTime + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyWhitelist(account_investor1, fromTime, toTime, expiryTime, true, {
                from: token_owner,
                gas: 6000000
            });
            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
            // Jump time
            await increaseTime(5000);
            // Fallback transaction
            console.log("BEFORE");
            await web3.eth.sendTransaction({
                from: account_investor1,
                to: I_CappedSTO.address,
                gas: 2100000,
                value: web3.utils.toWei("1", "ether")
            });
            console.log("AFTER");
            assert.equal((await I_CappedSTO.getRaised.call(0)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);

            assert.equal(await I_CappedSTO.investorCount.call(), 1);

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1000);
        });

        it("Should Fail in transferring the token from one whitelist investor 1 to non whitelist investor 2", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor2, 10 * Math.pow(10, 18), { from: account_investor1 }));
        });

        it("Should fail to provide the permission to the delegate to change the transfer bools -- Bad owner", async () => {
            // Add permission to the deletgate (A regesteration process)
            await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, { from: token_owner });
            let moduleData = (await I_SecurityToken.getModulesByType(permissionManagerKey))[0];
            I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData);
            await catchRevert(I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: account_temp }));
        });

        it("Should provide the permission to the delegate to change the transfer bools", async () => {
            // Add permission to the deletgate (A regesteration process)
            await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner });
            assert.isTrue(await I_GeneralPermissionManager.checkDelegate.call(account_delegate));
            // Providing the permission to the delegate
            await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm, true, {
                from: token_owner
            });
        });

        it("Should activate the bool allowAllTransfer", async () => {
            ID_snap = await takeSnapshot();
            let tx = await I_GeneralTransferManager.changeAllowAllTransfers(true, { from: account_delegate });

            assert.isTrue(tx.logs[0].args._allowAllTransfers, "AllowTransfer variable is not successfully updated");
        });

        it("Should fail to send tokens with the wrong granularity", async () => {
            await catchRevert(I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from: account_investor1 }));
        });

        it("Should adjust granularity", async () => {
            await catchRevert(I_SecurityToken.changeGranularity(0, { from: token_owner }));
        });

        it("Should adjust granularity", async () => {
            await I_SecurityToken.changeGranularity(Math.pow(10, 17), { from: token_owner });
            await I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from: account_investor1, gas: 2500000 });
            await I_SecurityToken.transfer(account_investor1, Math.pow(10, 17), { from: accounts[7], gas: 2500000 });
        });

        it("Should transfer from whitelist investor to non-whitelist investor in first tx and in 2nd tx non-whitelist to non-whitelist transfer", async () => {
            await I_SecurityToken.transfer(accounts[7], 10 * Math.pow(10, 18), { from: account_investor1, gas: 2500000 });

            assert.equal(
                (await I_SecurityToken.balanceOf(accounts[7])).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                10,
                "Transfer doesn't take place properly"
            );

            await I_SecurityToken.transfer(account_temp, 5 * Math.pow(10, 18), { from: accounts[7], gas: 2500000 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_temp)).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                5,
                "Transfer doesn't take place properly"
            );
            await revertToSnapshot(ID_snap);
        });

        it("Should bool allowAllTransfer value is false", async () => {
            assert.isFalse(await I_GeneralTransferManager.allowAllTransfers.call(), "reverting of snapshot doesn't works properly");
        });

        it("Should change the bool allowAllWhitelistTransfers to true", async () => {
            ID_snap = await takeSnapshot();
            let tx = await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, { from: account_delegate });

            assert.isTrue(tx.logs[0].args._allowAllWhitelistTransfers, "allowAllWhitelistTransfers variable is not successfully updated");
        });

        it("Should transfer from whitelist investor1 to whitelist investor 2", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_investor2, fromTime, toTime, expiryTime, true, {
                from: token_owner,
                gas: 500000
            });

            assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

            await I_SecurityToken.transfer(account_investor2, 10 * Math.pow(10, 18), { from: account_investor1, gas: 2500000 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                10,
                "Transfer doesn't take place properly"
            );
        });

        it("Should transfer from whitelist investor1 to whitelist investor 2 -- value = 0", async () => {
            let tx = await I_SecurityToken.transfer(account_investor2, 0, { from: account_investor1, gas: 2500000 });
            assert.equal(tx.logs[0].args.value.toNumber(), 0);
        });

        it("Should transferFrom from one investor to other", async () => {
            await I_SecurityToken.approve(account_investor1, 2 * Math.pow(10, 18), { from: account_investor2 });
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_investor3, fromTime, toTime, expiryTime, true, {
                from: token_owner,
                gas: 500000
            });

            assert.equal(tx.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");
            let log = await I_SecurityToken.transferFrom(account_investor2, account_investor3, 2 * Math.pow(10, 18), {
                from: account_investor1
            });
            assert.equal(log.logs[0].args.value.toNumber(), 2 * Math.pow(10, 18));
        });

        it("Should Fail in trasferring from whitelist investor1 to non-whitelist investor", async () => {
            await catchRevert(I_SecurityToken.transfer(account_temp, 10 * Math.pow(10, 18), { from: account_investor1, gas: 2500000 }));
            await revertToSnapshot(ID_snap);
        });

        it("Should successfully mint tokens while STO attached", async () => {
            await I_SecurityToken.mint(account_affiliate1, 100 * Math.pow(10, 18), { from: token_owner, gas: 500000 });
            let balance = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 400);
        });

        it("Should mint the tokens for multiple afiliated investors while STO attached", async () => {
            await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [100 * Math.pow(10, 18), 110 * Math.pow(10, 18)], {
                from: token_owner,
                gas: 500000
            });
            let balance1 = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(), 500);
            let balance2 = await I_SecurityToken.balanceOf(account_affiliate2);
            assert.equal(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(), 220);
        });

        it("Should provide more permissions to the delegate", async () => {
            // Providing the permission to the delegate
            await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist, true, {
                from: token_owner
            });

            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist)
            );
        });

        it("Should add the investor in the whitelist by the delegate", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_temp, fromTime, toTime, expiryTime, true, {
                from: account_delegate,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");
        });

        it("should account_temp successfully buy the token", async () => {
            // Fallback transaction
            await web3.eth.sendTransaction({
                from: account_temp,
                to: I_CappedSTO.address,
                gas: 2100000,
                value: web3.utils.toWei("1", "ether")
            });

            assert.equal((await I_CappedSTO.getRaised.call(0)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 2);

            assert.equal(await I_CappedSTO.investorCount.call(), 2);

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1000);
        });

        it("STO should fail to mint tokens after minting is frozen", async () => {
            let id = await takeSnapshot();
            await I_SecurityToken.freezeMinting({ from: token_owner });

            await catchRevert(
                web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei("1", "ether")
                })
            );
            await revertToSnapshot(id);
        });

        it("Should remove investor from the whitelist by the delegate", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_temp, 0, 0, 0, true, {
                from: account_delegate,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_temp, "Failed in removing the investor from whitelist");
        });

        it("should account_temp fail in buying the token", async () => {
            await catchRevert(
                web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei("1", "ether")
                })
            );
        });

        it("Should freeze the transfers", async () => {
            let tx = await I_SecurityToken.freezeTransfers({ from: token_owner });
            assert.isTrue(tx.logs[0].args._status);
        });

        it("Should fail to freeze the transfers", async () => {
            await catchRevert(I_SecurityToken.freezeTransfers({ from: token_owner }));
        });

        it("Should fail in buying to tokens", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(account_temp, fromTime, toTime, expiryTime, true, {
                from: account_delegate,
                gas: 6000000
            });

            assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");

            await catchRevert(
                web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei("1", "ether")
                })
            );
        });

        it("Should fail in trasfering the tokens from one user to another", async () => {
            await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, { from: token_owner });
            console.log(await I_SecurityToken.balanceOf(account_investor1));

            await catchRevert(I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_temp }));
        });

        it("Should unfreeze all the transfers", async () => {
            let tx = await I_SecurityToken.unfreezeTransfers({ from: token_owner });
            assert.isFalse(tx.logs[0].args._status);
        });

        it("Should freeze the transfers", async () => {
            await catchRevert(I_SecurityToken.unfreezeTransfers({ from: token_owner }));
        });

        it("Should able to transfers the tokens from one user to another", async () => {
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_temp });
        });

        it("Should check that the list of investors is correct", async () => {
            // Hardcode list of expected accounts based on transfers above

            let investors = await I_SecurityToken.getInvestors();
            let expectedAccounts = [account_affiliate1, account_affiliate2, account_investor1, account_temp];
            for (let i = 0; i < expectedAccounts.length; i++) {
                assert.equal(investors[i], expectedAccounts[i]);
            }
            assert.equal(investors.length, 4);
            console.log("Total Seen Investors: " + investors.length);
        });

        it("Should fail to set controller status because msg.sender not owner", async () => {
            await catchRevert(I_SecurityToken.setController(account_controller, { from: account_controller }));
        });

        it("Should successfully set controller", async () => {
            let tx1 = await I_SecurityToken.setController(account_controller, { from: token_owner });

            // check event
            assert.equal(address_zero, tx1.logs[0].args._oldController, "Event not emitted as expected");
            assert.equal(account_controller, tx1.logs[0].args._newController, "Event not emitted as expected");

            let tx2 = await I_SecurityToken.setController(address_zero, { from: token_owner });

            // check event
            assert.equal(account_controller, tx2.logs[0].args._oldController, "Event not emitted as expected");
            assert.equal(address_zero, tx2.logs[0].args._newController, "Event not emitted as expected");

            let tx3 = await I_SecurityToken.setController(account_controller, { from: token_owner });

            // check event
            assert.equal(address_zero, tx3.logs[0].args._oldController, "Event not emitted as expected");
            assert.equal(account_controller, tx3.logs[0].args._newController, "Event not emitted as expected");

            // check status
            let controller = await I_SecurityToken.controller.call();
            assert.equal(account_controller, controller, "Status not set correctly");
        });

        it("Should force burn the tokens - value too high", async () => {
            await I_GeneralTransferManager.changeAllowAllBurnTransfers(true, { from: token_owner });
            let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
            let currentBalance = await I_SecurityToken.balanceOf(account_temp);
            await catchRevert(
                I_SecurityToken.forceBurn(account_temp, currentBalance + web3.utils.toWei("500", "ether"), "", "", {
                    from: account_controller
                })
            );
        });
        it("Should force burn the tokens - wrong caller", async () => {
            await I_GeneralTransferManager.changeAllowAllBurnTransfers(true, { from: token_owner });
            let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
            let currentBalance = await I_SecurityToken.balanceOf(account_temp);
            await catchRevert(I_SecurityToken.forceBurn(account_temp, currentBalance, "", "", { from: token_owner }));
        });

        it("Should burn the tokens", async () => {
            let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
            let currentBalance = await I_SecurityToken.balanceOf(account_temp);
            // console.log(currentInvestorCount.toString(), currentBalance.toString());
            let tx = await I_SecurityToken.forceBurn(account_temp, currentBalance, "", "", { from: account_controller });
            // console.log(tx.logs[0].args._value.toNumber(), currentBalance.toNumber());
            assert.equal(tx.logs[0].args._value.toNumber(), currentBalance.toNumber());
            let newInvestorCount = await I_SecurityToken.getInvestorCount.call();
            // console.log(newInvestorCount.toString());
            assert.equal(newInvestorCount.toNumber() + 1, currentInvestorCount.toNumber(), "Investor count drops by one");
        });

        it("Should prune investor length", async () => {
            await I_SecurityToken.pruneInvestors(0, 10, { from: token_owner });
            // Hardcode list of expected accounts based on transfers above

            let investors = await I_SecurityToken.getInvestors.call();
            let expectedAccounts = [account_affiliate1, account_affiliate2, account_investor1];
            for (let i = 0; i < expectedAccounts.length; i++) {
                assert.equal(investors[i], expectedAccounts[i]);
            }
            assert.equal(investors.length, 3);
        });

        it("Should check the balance of investor at checkpoint", async () => {
            await catchRevert(I_SecurityToken.balanceOfAt(account_investor1, 5));
        });

        it("Should check the balance of investor at checkpoint", async () => {
            let balance = await I_SecurityToken.balanceOfAt(account_investor1, 0);
            assert.equal(balance.toNumber(), 0);
        });
    });

    describe("Withdraw Poly", async () => {
        it("Should successfully withdraw the poly", async () => {
            await catchRevert(I_SecurityToken.withdrawPoly(web3.utils.toWei("20000", "ether"), { from: account_temp }));
        });

        it("Should successfully withdraw the poly", async () => {
            let balanceBefore = await I_PolyToken.balanceOf(token_owner);
            await I_SecurityToken.withdrawPoly(web3.utils.toWei("20000", "ether"), { from: token_owner });
            let balanceAfter = await I_PolyToken.balanceOf(token_owner);
            assert.equal(
                BigNumber(balanceAfter)
                    .sub(BigNumber(balanceBefore))
                    .toNumber(),
                web3.utils.toWei("20000", "ether")
            );
        });

        it("Should successfully withdraw the poly", async () => {
            await catchRevert(I_SecurityToken.withdrawPoly(web3.utils.toWei("10", "ether"), { from: token_owner }));
        });
    });

    describe("Force Transfer", async () => {
        it("Should fail to forceTransfer because not approved controller", async () => {
            await catchRevert(
                I_SecurityToken.forceTransfer(account_investor1, account_investor2, web3.utils.toWei("10", "ether"), "", "reason", {
                    from: account_investor1
                })
            );
        });

        it("Should fail to forceTransfer because insufficient balance", async () => {
            await catchRevert(
                I_SecurityToken.forceTransfer(account_investor2, account_investor1, web3.utils.toWei("10", "ether"), "", "reason", {
                    from: account_controller
                })
            );
        });

        it("Should fail to forceTransfer because recipient is zero address", async () => {
            await catchRevert(
                I_SecurityToken.forceTransfer(account_investor1, address_zero, web3.utils.toWei("10", "ether"), "", "reason", {
                    from: account_controller
                })
            );
        });

        it("Should successfully forceTransfer", async () => {
            let sender = account_investor1;
            let receiver = account_investor2;

            let start_investorCount = await I_SecurityToken.getInvestorCount.call();
            let start_balInv1 = await I_SecurityToken.balanceOf.call(account_investor1);
            let start_balInv2 = await I_SecurityToken.balanceOf.call(account_investor2);

            let tx = await I_SecurityToken.forceTransfer(
                account_investor1,
                account_investor2,
                web3.utils.toWei("10", "ether"),
                "",
                "reason",
                { from: account_controller }
            );

            let end_investorCount = await I_SecurityToken.getInvestorCount.call();
            let end_balInv1 = await I_SecurityToken.balanceOf.call(account_investor1);
            let end_balInv2 = await I_SecurityToken.balanceOf.call(account_investor2);

            assert.equal(start_investorCount.add(1).toNumber(), end_investorCount.toNumber(), "Investor count not changed");
            assert.equal(
                start_balInv1.sub(web3.utils.toWei("10", "ether")).toNumber(),
                end_balInv1.toNumber(),
                "Investor balance not changed"
            );
            assert.equal(
                start_balInv2.add(web3.utils.toWei("10", "ether")).toNumber(),
                end_balInv2.toNumber(),
                "Investor balance not changed"
            );
            console.log(tx.logs[0].args);
            console.log(tx.logs[1].args);
            assert.equal(account_controller, tx.logs[0].args._controller, "Event not emitted as expected");
            assert.equal(account_investor1, tx.logs[0].args._from, "Event not emitted as expected");
            assert.equal(account_investor2, tx.logs[0].args._to, "Event not emitted as expected");
            assert.equal(web3.utils.toWei("10", "ether"), tx.logs[0].args._value, "Event not emitted as expected");
            console.log(tx.logs[0].args._verifyTransfer);
            assert.equal(false, tx.logs[0].args._verifyTransfer, "Event not emitted as expected");
            assert.equal("reason", web3.utils.hexToUtf8(tx.logs[0].args._data), "Event not emitted as expected");

            assert.equal(account_investor1, tx.logs[1].args.from, "Event not emitted as expected");
            assert.equal(account_investor2, tx.logs[1].args.to, "Event not emitted as expected");
            assert.equal(web3.utils.toWei("10", "ether"), tx.logs[1].args.value, "Event not emitted as expected");
        });

        it("Should fail to freeze controller functionality because not owner", async () => {
            await catchRevert(I_SecurityToken.disableController({ from: account_investor1 }));
        });

        it("Should fail to freeze controller functionality because disableControllerAllowed not activated", async () => {
            await catchRevert(I_SecurityToken.disableController({ from: token_owner }));
        });

        it("Should successfully freeze controller functionality", async () => {
            let tx1 = await I_FeatureRegistry.setFeatureStatus("disableControllerAllowed", true, { from: account_polymath });

            // check event
            assert.equal("disableControllerAllowed", tx1.logs[0].args._nameKey, "Event not emitted as expected");
            assert.equal(true, tx1.logs[0].args._newStatus, "Event not emitted as expected");

            let tx2 = await I_SecurityToken.disableController({ from: token_owner });

            // check state
            assert.equal(address_zero, await I_SecurityToken.controller.call(), "State not changed");
            assert.equal(true, await I_SecurityToken.controllerDisabled.call(), "State not changed");
        });

        it("Should fail to freeze controller functionality because already frozen", async () => {
            await catchRevert(I_SecurityToken.disableController({ from: token_owner }));
        });

        it("Should fail to set controller because controller functionality frozen", async () => {
            await catchRevert(I_SecurityToken.setController(account_controller, { from: token_owner }));
        });

        it("Should fail to forceTransfer because controller functionality frozen", async () => {
            await catchRevert(
                I_SecurityToken.forceTransfer(account_investor1, account_investor2, web3.utils.toWei("10", "ether"), "", "reason", {
                    from: account_controller
                })
            );
        });
    });

});