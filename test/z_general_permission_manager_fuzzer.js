import latestTime from './helpers/latestTime';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, 
         deployGPMAndVerifyed, 
         deployCountTMAndVerifyed, 
         deployLockupVolumeRTMAndVerified, 
         deployPercentageTMAndVerified, 
         deploySingleTradeVolumeRMAndVerified,
         deployManualApprovalTMAndVerifyed 
} from "./helpers/createInstances";
import { encodeModuleCall } from "./helpers/encodeCall";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const CountTransferManager = artifacts.require("./CountTransferManager");
const VolumeRestrictionTransferManager = artifacts.require('./LockupVolumeRestrictionTM');
const PercentageTransferManager = artifacts.require('./PercentageTransferManager');
const SingleTradeVolumeRestrictionManager = artifacts.require('./SingleTradeVolumeRestrictionTM');
const ManualApprovalTransferManager = artifacts.require('./ManualApprovalTransferManager');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('GeneralPermissionManager', accounts => {

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

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";
    const STVRParameters = ["bool", "uint256", "bool"];

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // CountTransferManager details
	const holderCount = 2; // Maximum number of token holders
	let bytesSTO = encodeModuleCall(["uint256"], [holderCount]);

	let _details = "details holding for test";
    let testRepeat = 20;

	// permission manager fuzz test
	let perms = ['ADMIN','WHITELIST', 'FLAGS', 'TRANSFER_APPROVAL'];
	let totalPerms = perms.length;

    before(async () => {
        // Accounts setup
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
            I_STRProxied
        ] = instances;

        // STEP 5: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 6: Deploy the GeneralDelegateManagerFactory
        [P_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

	    // Deploy Modules
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        [I_VolumeRestrictionTransferManagerFactory] = await deployLockupVolumeRTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        [I_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        [I_SingleTradeVolumeRestrictionManagerFactory] = await deploySingleTradeVolumeRMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        [P_SingleTradeVolumeRestrictionManagerFactory] = await deploySingleTradeVolumeRMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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

        it("Should successfully attach the General permission manager factory with the security token -- failed because Token is not paid", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_GeneralPermissionManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, { from: token_owner })
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

    describe("fuzz test for general transfer manager", async () => {

        it("should pass fuzz test for changeIssuanceAddress(), changeSigningAddress() ", async () => {

            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // // remove all existing permissions on account before test
                // for ( var a = 0; a < perms.length; a++) {
                //     await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, perms[a], false, { from: token_owner });
                // }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS', false, { from: token_owner }); 
                } else if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                let fromTime = latestTime();
                let toTime = latestTime() + duration.days(20);
                let expiryTime = toTime + duration.days(10);

                await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, randomPerms, true, { from: token_owner }); 

                let currentAllowAllTransferStats =  await I_GeneralTransferManager.allowAllTransfers();
                let currentAllowAllWhitelistTransfersStats =  await I_GeneralTransferManager.allowAllWhitelistTransfers();
                let currentAllowAllWhitelistIssuancesStats =  await I_GeneralTransferManager.allowAllWhitelistIssuances();
                let currentAllowAllBurnTransfersStats =  await I_GeneralTransferManager.allowAllBurnTransfers();

                // let userPerm = await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS');
                if (randomPerms === 'FLAGS') {
                    await I_GeneralTransferManager.changeIssuanceAddress( accounts[j], { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.issuanceAddress(), accounts[j]);

                    await I_GeneralTransferManager.changeSigningAddress( accounts[j], { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.signingAddress(), accounts[j]);

                    await I_GeneralTransferManager.changeAllowAllTransfers(!currentAllowAllTransferStats, { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.allowAllTransfers(), !currentAllowAllTransferStats);

                    await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(!currentAllowAllWhitelistTransfersStats, { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.allowAllWhitelistTransfers(), !currentAllowAllWhitelistTransfersStats);

                    await I_GeneralTransferManager.changeAllowAllWhitelistIssuances(!currentAllowAllWhitelistIssuancesStats, { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.allowAllWhitelistIssuances(), !currentAllowAllWhitelistIssuancesStats);

                    await I_GeneralTransferManager.changeAllowAllBurnTransfers(!currentAllowAllBurnTransfersStats, { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.allowAllBurnTransfers(), !currentAllowAllBurnTransfersStats);

                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " for functions with require perm FLAGS passed")
                } else {
                    await catchRevert(I_GeneralTransferManager.changeIssuanceAddress( accounts[j], { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.changeSigningAddress( accounts[j], { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.changeAllowAllTransfers( !currentAllowAllTransferStats, { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.changeAllowAllWhitelistTransfers( !currentAllowAllWhitelistTransfersStats, { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.changeAllowAllWhitelistIssuances( !currentAllowAllWhitelistIssuancesStats, { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.changeAllowAllBurnTransfers( !currentAllowAllBurnTransfersStats, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " for functions require perm FLAGS failed as expected");
                }
                if (randomPerms === 'WHITELIST') {
                    let tx = await I_GeneralTransferManager.modifyWhitelist(accounts[j], fromTime, toTime, expiryTime, true, { from: accounts[j] });                  
                    assert.equal(tx.logs[0].args._investor, accounts[j]);

                    let tx2 = await I_GeneralTransferManager.modifyWhitelistMulti([accounts[3], accounts[4]], [fromTime, fromTime], [toTime, toTime], [expiryTime, expiryTime], [true, true], { from: accounts[j] });
                    console.log(tx2.logs[1].args);
                    assert.equal(tx2.logs[1].args._investor, accounts[4]);
                } else {
                    await catchRevert(I_GeneralTransferManager.modifyWhitelist(accounts[j], fromTime, toTime, expiryTime, true, { from: accounts[j] }));
                    await catchRevert(I_GeneralTransferManager.modifyWhitelistMulti([accounts[3], accounts[4]], [fromTime, fromTime], [toTime, toTime], [expiryTime, expiryTime], [true, true], { from: accounts[j] })); 
                }
            }

            await I_GeneralTransferManager.changeIssuanceAddress("0x0000000000000000000000000000000000000000", { from: token_owner });
        })
    });

	describe("fuzz test for count transfer manager", async () => {

		it("Should successfully attach the CountTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManager module was not added"
            );
            I_CountTransferManager = CountTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for changeHolderCount()", async () => {

	        for (var i = 2; i < testRepeat; i++) {
	        	var j = Math.floor(Math.random() * 10);
	        	if (j === 1 || j === 0) { j = 2 };
	        	if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
	        		await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
	        	}

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_CountTransferManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_CountTransferManager.address, 'ADMIN', false, { from: token_owner }); 
                }

	        	let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
	        	await I_GeneralPermissionManager.changePermission(accounts[j], I_CountTransferManager.address, randomPerms, true, { from: token_owner });          		
                if (randomPerms === 'ADMIN') {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
         			await I_CountTransferManager.changeHolderCount(i + 1, { from: accounts[j] });
         			assert.equal((await I_CountTransferManager.maxHolderCount()).toNumber(), i + 1);
         			console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " passed");
         		} else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
         			await catchRevert(I_CountTransferManager.changeHolderCount(i+1, { from: accounts[j] }));
         			console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
         		}
	        }
        });
	});

    // lock up volume TM needs code change, not testing now
    // describe("fuzz test for lockup volume restriction transfer manager", async () => {

    //     it("Should Buy some tokens", async() => {

    //         await I_GeneralTransferManager.changeIssuanceAddress("0x0000000000000000000000000000000000000000", { from: token_owner });

    //         // Add the Investor in to the whitelist
    //         console.log("0");
    //         let tx = await I_GeneralTransferManager.modifyWhitelist(
    //             account_investor2,
    //             latestTime(),
    //             latestTime(),
    //             latestTime() + duration.days(10),
    //             true,
    //             {
    //                 from: account_issuer
    //         });

    //         assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");
    //         console.log("1");

    //         let tx2 = await I_GeneralTransferManager.modifyWhitelist(
    //             account_investor3,
    //             latestTime(),
    //             latestTime(),
    //             latestTime() + duration.days(10),
    //             true,
    //             {
    //                 from: account_issuer
    //         });

    //         console.log("2");
    //         // Jump time
    //         await increaseTime(5000);

    //         // Mint some tokens
    //         await I_SecurityToken.mint(account_investor2, web3.utils.toWei('9', 'ether'), { from: token_owner });
    //         console.log("1.5");
    //         await I_SecurityToken.mint(account_investor3, web3.utils.toWei('9', 'ether'), { from: token_owner });
    //         console.log("2");
    //         // assert.equal(
    //         //     (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
    //         //     web3.utils.toWei('9', 'ether')
    //         // );
    //         // assert.equal(
    //         //     (await I_SecurityToken.balanceOf(account_investor3)).toNumber(),
    //         //     web3.utils.toWei('9', 'ether')
    //         // );
    //     });

    //     it("Should successfully attach the VolumeRestrictionTransferManager with the security token", async () => {
    //         const tx = await I_SecurityToken.addModule(I_VolumeRestrictionTransferManagerFactory.address, 0, 0, 0, { from: token_owner });
    //         assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "VolumeRestrictionTransferManager doesn't get deployed");
    //         assert.equal(
    //             web3.utils.toAscii(tx.logs[2].args._name)
    //             .replace(/\u0000/g, ''),
    //             "LockupVolumeRestrictionTM",
    //             "VolumeRestrictionTransferManager module was not added"
    //         );
    //         I_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[2].args._module);
    //     });

    //     it("should pass fuzz test for addLockUp()", async () => {
    //         let balance = await I_SecurityToken.balanceOf(account_investor2);
    //         // await I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 12, 4, 0, balance, { from: token_owner });

    //         for (var i = 2; i < testRepeat; i++) {
    //             var j = Math.floor(Math.random() * 10);
    //             if (j === 1 || j === 0) { j = 2 };
    //             if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
    //                 await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
    //             }

    //             // target permission should alaways be false for each test before assigning
    //             if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN') === true) {
    //                 await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN', false, { from: token_owner });
    //             }

    //             let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
    //             await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, randomPerms, true, { from: token_owner });  

    //             if (randomPerms === 'ADMIN') {
    //                 // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
    //                 await I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 12, 4, 0, balance, { from:accounts[j] });
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " passed");
    //             } else {
    //                 // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
    //                 await catchRevert(I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 12, 4, 0, balance, { from:accounts[j] }));
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
    //             }
    //         }
    //     });

    //     it("should pass fuzz test for remove lock up", async () => {
    //         let balance = await I_SecurityToken.balanceOf(account_investor2);
    //         console.log("1");
    //         for (var i = 2; i < testRepeat; i++) {
    //             var j = Math.floor(Math.random() * 10);
    //             if (j === 1 || j === 0) { j = 2 };
    //             if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
    //                 await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
    //             }

    //             // target permission should alaways be false for each test before assigning
    //             if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN') === true) {
    //                 await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN', false, { from: token_owner });
    //             }

    //             let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
    //             await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, randomPerms, true, { from: token_owner });  

    //             // if lockup count is 0, add a lockup.
    //             let lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2, { from : token_owner });
            
    //             if (lockUpCount === 0) {
    //                 console.log("lock up count is " + lockUpCount);
    //                 await I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 12, 4, 0, balance, token_owner);
    //             }

    //             let lockUpCountNow = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2, { from : token_owner });

    //             console.log("lock up count now is "+lockUpCountNow);

    //             // try remove lock up
    //             if (randomPerms === 'ADMIN') {
    //                 // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
    //                 await I_VolumeRestrictionTransferManager.removeLockUp(account_investor2, 0, { from:accounts[j] });
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " passed");
    //             } else {
    //                 // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
    //                 await catchRevert(I_VolumeRestrictionTransferManager.removeLockUp(account_investor2, 0, { from:accounts[j] }));
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
    //             }
    //         }
    //     });

    //     it("should pass fuzz test for add multiple lock ups", async () => {

    //         // add mutiple lock ups at once
    //         for (var i = 2; i < testRepeat; i++) {
    //             var j = Math.floor(Math.random() * 10);
    //             if (j === 1 || j === 0) { j = 2 };
    //             if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
    //                 await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
    //             }

    //             // target permission should alaways be false for each test before assigning
    //             if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN') === true) {
    //                 await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN', false, { from: token_owner });
    //             }

    //             let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
    //             await I_GeneralPermissionManager.changePermission(accounts[j], I_VolumeRestrictionTransferManager.address, randomPerms, true, { from: token_owner }); 

    //              // check current lockup count before adding multiple
    //             let lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
    //             let lockUpCount2 = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor3);

    //             let balance = await I_SecurityToken.balanceOf(account_investor2);
    //             let balance2 = await I_SecurityToken.balanceOf(account_investor3);
  
    //             // try add multi lock ups
    //             if (randomPerms === 'ADMIN') {
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
    //                 console.log("current perm should be true --> " + await I_GeneralPermissionManager.checkPermission(accounts[j], I_VolumeRestrictionTransferManager.address, 'ADMIN'));
    //                 await I_VolumeRestrictionTransferManager.addLockUpMulti(
    //                     [account_investor2, account_investor3],
    //                     [24, 8],
    //                     [4, 4],
    //                     [0, 0],
    //                     [balance, balance2],
    //                     { from: accounts[j] }
    //                 );
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " passed");
    //                 assert.equal(await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2), lockUpCount+1);
    //                 assert.equal(await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor3), lockUpCount2+1);
    //             } else {
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
    //                 await catchRevert(
    //                     I_VolumeRestrictionTransferManager.addLockUpMulti(
    //                     [account_investor2, account_investor3],
    //                     [24, 8],
    //                     [4, 4],
    //                     [0, 0],
    //                     [balance, balance2],
    //                     { from: accounts[j] }
    //                 ));
    //                 console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
    //             }
    //         }

    //     });

    //     it("should pass fuzz test for modify lock ups", async () => {
    //         // add a lock up if there is no existing one

    //         // modify lock up

    //         // paused due to the current module is not ready for test
    //     });

    // });


    describe("fuzz test for percentage transfer manager", async () => {

        // PercentageTransferManager details
        const holderPercentage = 70 * 10**16;           // Maximum number of token holders

        let bytesSTO = web3.eth.abi.encodeFunctionCall({
            name: 'configure',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: '_maxHolderPercentage'
            },{
                type: 'bool',
                name: '_allowPrimaryIssuance'
            }
            ]
        }, [holderPercentage, false]);

         it("Should successfully attach the percentage transfer manager with the security token", async () => {
            console.log("1");
            const tx = await I_SecurityToken.addModule(I_PercentageTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            // assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "VolumeRestrictionTransferManager doesn't get deployed");
            // assert.equal(
            //     web3.utils.toAscii(tx.logs[2].args._name)
            //     .replace(/\u0000/g, ''),
            //     "LockupVolumeRestrictionTM",
            //     "VolumeRestrictionTransferManager module was not added"
            // );
            I_PercentageTransferManager = PercentageTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for modifyWhitelist with perm WHITELIST", async () => {

            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, randomPerms, true, { from: token_owner });  

                //try add multi lock ups
                if (randomPerms === 'WHITELIST') {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_PercentageTransferManager.modifyWhitelist(account_investor3, true, { from: accounts[j] });
                    console.log("Test number " + i + " with account " + j + " and perm WHITELIST passed as expected");
                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_PercentageTransferManager.modifyWhitelist(account_investor3, true, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for modifyWhitelistMulti with perm WHITELIST", async () => {
        
           for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, randomPerms, true, { from: token_owner });  
 
                if (randomPerms === 'WHITELIST') {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                   await I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [false, true], { from: accounts[j] });
                   console.log("Test number " + i + " with account " + j + " and perm WHITELIST passed as expected");

                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert( I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [false, true], { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for setAllowPrimaryIssuance with perm ADMIN", async () => {

             // let snapId = await takeSnapshot();

             for (var i = 2; i < testRepeat; i++) {

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'ADMIN', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, randomPerms, true, { from: token_owner });  

                let primaryIssuanceStat = await I_PercentageTransferManager.allowPrimaryIssuance({ from: token_owner });
               
                if (randomPerms === 'ADMIN') {
                   console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                   await I_PercentageTransferManager.setAllowPrimaryIssuance(!primaryIssuanceStat, { from: accounts[j] });
                   console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");

                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert( I_PercentageTransferManager.setAllowPrimaryIssuance(!primaryIssuanceStat, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
                // await revertToSnapshot(snapId);
            }
        });
    });


    describe("fuzz test for single trade volume manager", async () => {

        it("attach the single trade volume restriction manager ", async () => {

            let managerArgs = encodeModuleCall(STVRParameters, [false, 90, false]);
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });

            let tx = await I_SecurityToken.addModule(P_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, web3.utils.toWei("500", "ether"), 0, {
            from: token_owner
            });

            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "SingleTradeVolumeRestrictionManager did not get deployed");
            assert.equal(
            web3.utils.toAscii(tx.logs[3].args._name)
            .replace(/\u0000/g, ''),
            "SingleTradeVolumeRestrictionTM",
            "SingleTradeVolumeRestrictionManagerFactory module was not added"
            );
            P_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx.logs[3].args._module);


            console.log("1");
            managerArgs = encodeModuleCall(STVRParameters, [false, (7 * Math.pow(10, 16)).toString(), false])

            console.log("1.1");
            let tx2 = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, { from: token_owner });
            console.log("1.2");
            // assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "TransferManager doesn't get deployed");
            // assert.equal(
            // web3.utils.toAscii(tx.logs[2].args._name)
            // .replace(/\u0000/g, ''),
            // "SingleTradeVolumeRestrictionTM",
            // "SingleTradeVolumeRestriction module was not added"
            // );
            I_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx2.logs[2].args._module);
            console.log("2");

            managerArgs = encodeModuleCall(STVRParameters, [true, 90, false]);
            let tx3 = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, {
            from: token_owner
            });

            I_SingleTradeVolumeRestrictionPercentageManager = SingleTradeVolumeRestrictionManager.at(tx3.logs[2].args._module);
            console.log("3");
        });

        it("should pass fuzz test for setAllowPrimaryIssuance with perm ADMIN", async () => {
           
            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();


                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, randomPerms, true, { from: token_owner });  
               
                if (randomPerms === 'ADMIN') {
                   console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                   await I_SingleTradeVolumeRestrictionManager.setAllowPrimaryIssuance(true, {from: accounts[j]});
                   console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert( I_SingleTradeVolumeRestrictionManager.setAllowPrimaryIssuance(true, {from: accounts[j]}) );
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            }
        });

        it("should pass fuzz test for changeTransferLimitToTokens & changeGlobalLimitInTokens with perm ADMIN", async () => {

            // await I_GeneralPermissionManager.changePermission(accounts[3], I_SingleTradeVolumeRestrictionManager.address, "ADMIN", true, { from: token_owner });  
            
            // console.log("1");
            // let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, {
            // from: accounts[3]
            // });
            // console.log("2");
            // assert.equal(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), false, "Error Changing");
            // assert.equal(tx.logs[0].args._amount.toNumber(), 1, "Transfer limit not changed");
            // console.log("3");
            // //test set global limit in tokens
            // tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, {
            // from: token_owner
            // });
            // console.log("4");
            // assert.equal(tx.logs[0].args._amount, 10, "Global Limit not set");
            // console.log("5");
            let tx;

            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, randomPerms, true, { from: token_owner });  
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, randomPerms, true, { from: token_owner });  
               
                if (randomPerms == 'ADMIN' ) {
                    console.log("current limit in percentage is "+ await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({ from: token_owner }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    console.log("current permission for ADMIN is " + await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN'));
                    tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, { from: accounts[j] });

                    // assert.equal(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), false, "Error Changing");
                    // assert.equal(tx.logs[0].args._amount.toNumber(), 1, "Transfer limit not changed");
                    console.log("1.1");
                    tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, {from: accounts[j]});
                    console.log("1.2");
                    // assert.equal(tx.logs[0].args._amount, 10, "Global Limit not set");
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("current limit in percentage is "+ await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({ from: token_owner }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should fail");
                    console.log("current permission for ADMIN is" + await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN'));
                    await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, { from: accounts[j] })); 
                    // await catchRevert(I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, {from: token_owner}));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            }
        });

        it("should pass fuzz test for changeTransferLimitToPercentage & changeGlobalLimitInPercentage with perm ADMIN", async () => {
       
            // // console.log("1");
            // // console.log("current limit in percentage is "+ await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({from: token_owner }));
            // tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToPercentage(1, {
            // from: token_owner
            // });
            // assert.ok(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), "Error Changing");
            // assert.equal(tx.logs[0].args._percentage.toNumber(), 1, "Transfer limit not changed");
            // console.log("2");
            // // changeGlobalLimitInPercentage
            // tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(40, { from: token_owner });
            // assert.equal(tx.logs[0].args._percentage, 40, "Global Limit not set");
            // console.log("3");

            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

                let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, { from: token_owner });
  
                tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, { from: token_owner });

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, randomPerms, true, { from: token_owner });  
             
                if (randomPerms == "ADMIN" ) {
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN " + " should pass");
                    // console.log("current permission ADMIN status is "+ await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, 'ADMIN'));
                     tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToPercentage(1, { from: accounts[j] });
                    // assert.equal(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), false, "Error Changing");
                    // assert.equal(tx.logs[0].args._amount.toNumber(), 1, "Transfer limit not changed");
                    console.log("1.1");
                    tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(40, { from: accounts[j] });
                    console.log("1.2");
                    // assert.equal(tx.logs[0].args._amount, 10, "Global Limit not set");
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("current limit in percentage is "+ await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({ from: token_owner }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, { from: accounts[j] })); 
                    // await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(10, {from: token_owner}));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            }
        });

        it("should pass fuzz test for addExemptWallet,  removeExemptWallet, setTransferLimitInTokens, removeTransferLimitInTokens with perm ADMIN", async () => {

            // //add
            // let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], {
            // from: token_owner
            // });
            // assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet added as exempt");

            // //remove
            // tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5], { from: token_owner });
            // assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet removed from exempt");

            // //set transfer limit in tokens
            // tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100, {
            // from: token_owner
            // });
            // assert.equal(tx.logs[0].args._wallet, accounts[4]);
            // assert.equal(tx.logs[0].args._amount, 100);

            // tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 50, { from: token_owner });
            // assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet added to transfer limits");
            // assert.equal(tx.logs[0].args._percentage, 50, "Wrong percentage set");

            // tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokens(accounts[4], {
            // from: token_owner
            // });
            // assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet removed");

            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

                let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, { from: token_owner });
  
                tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, { from: token_owner});

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, randomPerms, true, { from: token_owner });  
            
                if (randomPerms === "ADMIN" ) {
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN " + " should pass");

                    //add
                    let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], { from: accounts[j]});
                    assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet added as exempt");

                    console.log("passed add");

                    //remove
                    tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5], { from: accounts[j] });
                    assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet removed from exempt");

                    console.log("passed remove");

                    //set transfer limit in tokens
                    tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100, { from: accounts[j] });
                    assert.equal(tx.logs[0].args._wallet, accounts[4]);
                    assert.equal(tx.logs[0].args._amount, 100);

                    console.log("passed set limit in tokens");

                    tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokens(accounts[4], { from: accounts[j] });
                    assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet removed");
                    console.log("removed set limit in tokens");

                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], { from: accounts[j]}));

                    let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], { from: token_owner});
                    await catchRevert(I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5], { from: accounts[j] }));

                    await catchRevert(I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100, { from: accounts[j] }));

                    tx = I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100, { from: token_owner });
                    await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 50, { from: accounts[j] }));

                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            }
        });

        it("should pass fuzz test for addExemptWalletMulti, removeExemptWalletMulti, setTransferLimitInTokensMulti, removeTransferLimitInTokensMulti, setTransferLimitInPercentageMulti, removeTransferLimitInPercentageMulti with perm ADMIN", async () => {

            // console.log("0");

            let wallets = [accounts[0], accounts[1], accounts[2]];
            let tokenLimits = [1, 2, 3];
            let percentageLimits = [5, 6, 7];

            // // add exempt wallet multi
            // let tx = await P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, {
            // from: token_owner
            // });
            // let logs = tx.logs.filter(log => log.event === 'ExemptWalletAdded');
            // assert.equal(logs.length, wallets.length, "Batch Exempt wallets not added");
            // for (let i = 0; i < logs.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
            // }

            // console.log("1");

            // // remove exempt wallet multi
            // tx = await P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, {
            // from: token_owner
            // })
            // logs = tx.logs.filter(log => log.event === 'ExemptWalletRemoved');
            // assert.equal(logs.length, wallets.length, "Batch Exempt wallets not removed");

            // for (let i = 0; i < logs.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
            // }

            //            console.log("2");

            // tx = await P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti(wallets, tokenLimits, {
            // from: token_owner
            // });
            // logs = tx.logs.filter(log => log.event == 'TransferLimitInTokensSet');
            
            // assert.equal(wallets.length, logs.length, "Transfer limit not set");
            
            // for (let i = 0; i < wallets.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not set for wallet");
            // assert.equal(logs[i].args._amount.toNumber(), tokenLimits[i]);
            // }
            // console.log("3");

            // tx = await P_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti(wallets, {
            // from: token_owner
            // });
            // logs = tx.logs.filter(log => log.event === 'TransferLimitInTokensRemoved');
            // assert.equal(logs.length, wallets.length, "Transfer limit not removed");

            // for (let i = 0; i < wallets.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not removed for wallet");
            // }
            // console.log("4");

            // console.log("transfer limit in percentage needs to be true to pass --> " + await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({from: token_owner}));

            // tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, {
            // from: token_owner
            // });
            // logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageSet');
            // assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

            // for (let i = 0; i < wallets.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
            // assert.equal(logs[i].args._percentage.toNumber(), percentageLimits[i]);
            // }
            // console.log("5");
    
            // tx = await I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentageMulti(wallets, {
            // from: token_owner
            // });
            // logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageRemoved');
            // assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

            // for (let i = 0; i < wallets.length; i++) {
            // assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
            // }
            // console.log("6");

            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

                console.log("0.1");
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                console.log("0.2");

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, 'ADMIN', false, { from: token_owner });
                }

                console.log("0.3");

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionManager.address, randomPerms, true, { from: token_owner });
                await I_GeneralPermissionManager.changePermission(accounts[j], I_SingleTradeVolumeRestrictionPercentageManager.address, randomPerms, true, { from: token_owner });  
              
                console.log("0.4");

                if (randomPerms === "ADMIN" ) {
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN " + " should pass");

                     // add exempt wallet multi
                    let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, {
                    from: accounts[j]
                    });

                    console.log("1");

                    // remove exempt wallet multi
                    tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, {
                    from: accounts[j]
                    });

                    console.log("2");

                    tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti(wallets, tokenLimits, {
                    from: accounts[j]
                    });
                    console.log("3");

                    tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti(wallets, {
                    from: accounts[j]
                    });
                    console.log("4");

                    console.log("transfer limit in percentage needs to be true to pass --> " + await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage({from: accounts[j]}));

                    tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, {
                    from: accounts[j]
                    });

                    let logs;

                    logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageSet');
                    assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

                    for (let i = 0; i < wallets.length; i++) {
                    assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
                    assert.equal(logs[i].args._percentage.toNumber(), percentageLimits[i]);
                    }
                    console.log("5");

                    tx = await I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentageMulti(wallets, {
                    from: accounts[j]
                    });
                    logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageRemoved');
                    assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

                    for (let i = 0; i < wallets.length; i++) {
                    assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
                    }
                    console.log("6");

                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");

                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                   
                    // add exempt wallet multi
                    let tx;

                    await catchRevert( P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, {
                    from: accounts[j]
                    }));

                    console.log("1");

                    await P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, { from: token_owner });
                    await catchRevert(P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, { from: accounts[j] }));

                    // remove exempt wallet multi
                    await P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, { from: token_owner });
                    await catchRevert(P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti(wallets, tokenLimits, { from: accounts[j] }));
                    console.log("2");

                    await P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti(wallets, tokenLimits, { from: token_owner });
                    await catchRevert(P_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti(wallets, {from: accounts[j]}));

                    await P_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti(wallets, {from: token_owner});
                    await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, { from: accounts[j] }));
                    console.log("3");

                    await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, { from: token_owner });
                    await catchRevert(I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentageMulti(wallets, { from: accounts[j] }));

                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
                await revertToSnapshot(snapId);
            }

        });

    });


    describe("fuzz test for manual approval transfer manager", async () => {

        // it("Should Buy the tokens", async () => {
        //     // Add the Investor in to the whitelist

        //     await I_GeneralTransferManager.changeIssuanceAddress("0x0000000000000000000000000000000000000000", { from: token_owner });

        //     let tx = await I_GeneralTransferManager.modifyWhitelist(
        //         account_investor1,
        //         latestTime(),
        //         latestTime(),
        //         latestTime() + duration.days(10),
        //         true,
        //         {
        //             from: account_issuer,
        //             gas: 6000000
        //         }
        //     );

        //     assert.equal(
        //         tx.logs[0].args._investor.toLowerCase(),
        //         account_investor1.toLowerCase(),
        //         "Failed in adding the investor in whitelist"
        //     );

        //     // Jump time
        //     await increaseTime(5000);

        //     console.log("1");

        //     // Mint some tokens
        //     await I_SecurityToken.mint(account_investor1, web3.utils.toWei("4", "ether"), { from: token_owner });
        //     console.log("2");
        //     assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("4", "ether"));
        // });

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

        it("should pass fuzz test for addManualApproval & revokeManualApproval with perm TRANSFER_APPROVAL", async () => {
            
            // console.log("1");
            // await I_ManualApprovalTransferManager.addManualApproval(
            //     account_investor1,
            //     account_investor4,
            //     web3.utils.toWei("2", "ether"),
            //     latestTime() + duration.days(1),
            //     { from: token_owner }
            // );
            // console.log("2");
            // let tx = await I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {
            //     from: token_owner
            // });
            // assert.equal(tx.logs[0].args._from, account_investor1);
            // assert.equal(tx.logs[0].args._to, account_investor4);
            // assert.equal(tx.logs[0].args._addedBy, token_owner);
            // await I_ManualApprovalTransferManager.addManualApproval(
            //     account_investor1,
            //     account_investor4,
            //     web3.utils.toWei("2", "ether"),
            //     latestTime() + duration.days(1),
            //     { from: token_owner }
            // );
            // console.log("3");
            let tx;

            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

               
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, randomPerms, true, { from: token_owner });  
            
                if (randomPerms === "TRANSFER_APPROVAL" ) {
                    console.log("Test number " + i + " with account " + j + " and perm TRANSFER_APPROVAL " + " should pass");
                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        web3.utils.toWei("2", "ether"),
                        latestTime() + duration.days(1),
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
                    console.log("Test number " + i + " with account " + j + " and perm TRANSFER_APPROVAL passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(
                        I_ManualApprovalTransferManager.addManualApproval(
                            account_investor1,
                            account_investor4,
                            web3.utils.toWei("2", "ether"),
                            latestTime() + duration.days(1),
                            { from: accounts[j] }
                        )
                    );

                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        web3.utils.toWei("2", "ether"),
                        latestTime() + duration.days(1),
                        { from: token_owner }
                    );

                    await catchRevert(I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {
                        from: accounts[j]
                    })
                    );


                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            };


        });

        it("should pass fuzz test for addManualBlocking and revokeManualBlocking with perm TRANSFER_APPROVAL", async () => {
            console.log("1");
            await I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, latestTime() + duration.days(1), {
                from: token_owner
            });
            console.log("2");
            await I_ManualApprovalTransferManager.revokeManualBlocking(account_investor1, account_investor2, { from: token_owner });
            console.log("3");


            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();
         
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 };
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL', false, { from: token_owner });
                }

                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, randomPerms, true, { from: token_owner });  
            
                if (randomPerms === "TRANSFER_APPROVAL") {
                    console.log("Test number " + i + " with account " + j + " and perm TRANSFER_APPROVAL " + " should pass");
                    await I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, latestTime() + duration.days(1), {
                        from: accounts[j]
                    });
                    
                    console.log("2");
                    await I_ManualApprovalTransferManager.revokeManualBlocking(account_investor1, account_investor2, { from: accounts[j] });

                    console.log("Test number " + i + " with account " + j + " and perm TRANSFER_APPROVAL passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(
                        I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, latestTime() + duration.days(1), {
                        from: accounts[j]
                    })
                    );

                    await  I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, latestTime() + duration.days(1), {
                        from: token_owner
                    });

                    await catchRevert(
                        I_ManualApprovalTransferManager.revokeManualBlocking(account_investor1, account_investor2, { from: accounts[j] })
                    );

                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            };
        }); 
    });

});
