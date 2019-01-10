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
         deployManualApprovalTMAndVerifyed 
} from "./helpers/createInstances";
import { encodeModuleCall } from "./helpers/encodeCall";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const CountTransferManager = artifacts.require("./CountTransferManager");
const VolumeRestrictionTransferManager = artifacts.require('./LockupVolumeRestrictionTM');
const PercentageTransferManager = artifacts.require('./PercentageTransferManager');
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

            console.log("1");
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
                
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS', false, { from: token_owner }); 
                } else if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                let fromTime = latestTime();
                let toTime = latestTime() + duration.days(20);
                let expiryTime = toTime + duration.days(10);

                await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, randomPerms, true, { from: token_owner }); 

                let currentAllowAllTransferStats =  await I_GeneralTransferManager.allowAllTransfers();
                let currentAllowAllWhitelistTransfersStats =  await I_GeneralTransferManager.allowAllWhitelistTransfers();
                let currentAllowAllWhitelistIssuancesStats =  await I_GeneralTransferManager.allowAllWhitelistIssuances();
                let currentAllowAllBurnTransfersStats =  await I_GeneralTransferManager.allowAllBurnTransfers();
                console.log("2");
                // let userPerm = await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS');
                if (randomPerms === 'FLAGS') {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " about to start")
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

                console.log("3");
                if (randomPerms === 'WHITELIST') {
                    let tx = await I_GeneralTransferManager.modifyWhitelist(accounts[j], fromTime, toTime, expiryTime, 1, { from: accounts[j] });                  
                    assert.equal(tx.logs[0].args._investor, accounts[j]);
                    console.log("3.1");
                    let tx2 = await I_GeneralTransferManager.modifyWhitelistMulti([accounts[3], accounts[4]], [fromTime, fromTime], [toTime, toTime], [expiryTime, expiryTime], [1, 1], { from: accounts[j] });
                    console.log(tx2.logs[1].args);
                    assert.equal(tx2.logs[1].args._investor, accounts[4]);
                    console.log("3.2");
                } else {
                    console.log("3.3");
                    await catchRevert(I_GeneralTransferManager.modifyWhitelist(accounts[j], fromTime, toTime, expiryTime, 1, { from: accounts[j] }));
                    console.log("3.4");
                    await catchRevert(I_GeneralTransferManager.modifyWhitelistMulti([accounts[3], accounts[4]], [fromTime, fromTime], [toTime, toTime], [expiryTime, expiryTime], [1, 1], { from: accounts[j] })); 
                    console.log("3.5");
                }
            }
            console.log("4");
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
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
	        for (var i = 2; i < testRepeat; i++) {
	        	var j = Math.floor(Math.random() * 10);
	        	if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
	        	
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
	        		await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
	        	}

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_CountTransferManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_CountTransferManager.address, 'ADMIN', false, { from: token_owner }); 
                }

	        	// assign a random perm
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
            I_PercentageTransferManager = PercentageTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for modifyWhitelist with perm WHITELIST", async () => {
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
                
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, randomPerms, true, { from: token_owner });  

                //try add multi lock ups
                if (randomPerms === 'WHITELIST') {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_PercentageTransferManager.modifyWhitelist(account_investor3, 1, { from: accounts[j] });
                    console.log("Test number " + i + " with account " + j + " and perm WHITELIST passed as expected");
                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_PercentageTransferManager.modifyWhitelist(account_investor3, 1, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for modifyWhitelistMulti with perm WHITELIST", async () => {
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
           for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
                
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'WHITELIST', false, { from: token_owner });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, randomPerms, true, { from: token_owner });  
 
                if (randomPerms === 'WHITELIST') {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                   await I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [0, 1], { from: accounts[j] });
                   console.log("Test number " + i + " with account " + j + " and perm WHITELIST passed as expected");

                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert( I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [0, 1], { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for setAllowPrimaryIssuance with perm ADMIN", async () => {

             // let snapId = await takeSnapshot();
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
             for (var i = 2; i < testRepeat; i++) {

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
                
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, 'ADMIN') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, 'ADMIN', false, { from: token_owner });
                }

                // assign a random perm
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


    describe("fuzz test for manual approval transfer manager", async () => {

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
            
            let tx;
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {

                let snapId = await takeSnapshot();

               
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) { j = 2 }; // exclude account 1 & 0 because they might come with default perms
                
                // add account as a Delegate if it is not
                if (await I_GeneralPermissionManager.checkDelegate(accounts[j]) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], _details, { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (await I_GeneralPermissionManager.checkPermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL') === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, 'TRANSFER_APPROVAL', false, { from: token_owner });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, randomPerms, true, { from: token_owner });  
            
                if (randomPerms === "TRANSFER_APPROVAL" ) {
                    console.log("Test number " + i + " with account " + j + " and perm TRANSFER_APPROVAL " + " should pass");
                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        web3.utils.toWei("2", "ether"),
                        latestTime() + duration.days(1),
                        "ABC",
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
                            "ABC",
                            { from: accounts[j] }
                        )
                    );

                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        web3.utils.toWei("2", "ether"),
                        latestTime() + duration.days(1),
                        "ABC",
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
    });

});
