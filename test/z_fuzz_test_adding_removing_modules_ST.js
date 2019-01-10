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

// modules for test
const CountTransferManager = artifacts.require("./CountTransferManager");
const ManualApprovalTransferManager = artifacts.require('./ManualApprovalTransferManager');
const VolumeRestrictionTransferManager = artifacts.require('./LockUpTransferManager');
const PercentageTransferManager = artifacts.require('./PercentageTransferManager');



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
  

    //Define all modules for test
    let I_CountTransferManagerFactory;
    let I_CountTransferManager;
    
    let I_ManualApprovalTransferManagerFactory;
    let I_ManualApprovalTransferManager;

    let I_VolumeRestrictionTransferManagerFactory;
    let I_VolumeRestrictionTransferManager;

    let I_PercentageTransferManagerFactory;
    let I_PercentageTransferManager;

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

	let _details = "details holding for test";
    let testRepeat = 20;

	// define factories and modules for fuzz test
    var factoriesAndModules = [
        { factory: 'I_CountTransferManagerFactory', module: 'CountTransferManager'},
        { factory: 'I_ManualApprovalTransferManagerFactory', module: 'ManualApprovalTransferManager'},
        { factory: 'I_VolumeRestrictionTransferManagerFactory', module: 'VolumeRestrictionTransferManager'},
        { factory: 'I_PercentageTransferManagerFactory', module: 'PercentageTransferManager'},
    ];

    let totalModules = factoriesAndModules.length;
    let bytesSTO;


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

        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

	    // Deploy Modules
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        [I_VolumeRestrictionTransferManagerFactory] = await deployLockupVolumeRTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        [I_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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



    describe("adding and removing different modules", async () => {

        it("should pass test for randomly adding and removing modules ", async () => {

            console.log("1");
            // fuzz test loop over total times of testRepeat
            for (var i = 0; i < testRepeat; i++) {
                
                console.log("1.2");

                // choose a random module with in the totalMoudules available
                let random = factoriesAndModules[Math.floor(Math.random() * Math.floor(totalModules))];
                let randomFactory = eval(random.factory);
                let randomModule = eval(random.module);
                console.log("choosen factory "+ random.factory);
                console.log("choosen module "+ random.module);

                //calculate the data needed for different modules
                if (random.module == 'CountTransferManager' ||  random.module == 'ManualApprovalTransferManager' || random.module == 'VolumeRestrictionTransferManager' ){
                    const holderCount = 2; // Maximum number of token holders
                    bytesSTO = encodeModuleCall(["uint256"], [holderCount]);
                } else if (random.module == 'PercentageTransferManager'){
                    console.log("PTM 01");
                    const holderPercentage = 70 * 10**16;    
                    bytesSTO = web3.eth.abi.encodeFunctionCall({
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
                    console.log("encoded.");
                } else {
                    console.log("no data defined for choosen module "+random.module);
                }
            
                // attach it to the ST
                let tx = await I_SecurityToken.addModule(randomFactory.address, bytesSTO, 0, 0, { from: token_owner });
                console.log("1.3");
                let randomModuleInstance = randomModule.at(tx.logs[2].args._module);
                console.log("successfully attached module " + randomModuleInstance.address);
                
                // remove it from the ST
                tx = await I_SecurityToken.archiveModule(randomModuleInstance.address, { from: token_owner });
                console.log("1.4");
                tx = await I_SecurityToken.removeModule(randomModuleInstance.address, { from: token_owner });
                console.log("successfully removed module " + randomModuleInstance.address);

            }
        })
    });

});
