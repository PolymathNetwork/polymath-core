import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const VolumeRestrictionTransferManagerFactory = artifacts.require('./VolumeDumpingRestrictionManagerFactory.sol');
const VolumeRestrictionTransferManager = artifacts.require('./VolumeDumpingRestrictionManager');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VolumeDumpingRestrictionTransferManager', accounts => {

     // Accounts Variable declaration
     let account_polymath;
     let account_issuer;
     let token_owner;
     let token_owner_pk;
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
    // let P_PercentageTransferManagerFactory;
    let P_VolumeRestrictionTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    // let P_PercentageTransferManager;
    let P_VolumeRestrictionTransferManager;
    let I_GeneralTransferManagerFactory;
    // let I_PercentageTransferManagerFactory;
    let I_VolumeRestrictionTransferManagerFactory;
    let I_GeneralPermissionManager;
    // let I_PercentageTransferManager;
    let I_VolumeRestrictionTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_ModuleRegistryProxy

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
    const initRegFee = web3.utils.toWei("250");

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";
    const STOParameters = ['uint256', 'uint256', 'uint256', 'string'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    let bytesSTO = encodeModuleCall(STOParameters, [latestTime() + duration.seconds(1000), latestTime() + duration.days(40), cap, someString]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[5];


          // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

         // Step 2: Deploy the FeatureRegistry

         I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });

        // STEP 3: Deploy the ModuleRegistry
     
        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});
        // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);


        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );


        // STEP 5: Deploy the VolumeRestrictionTransferManager
        I_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_VolumeRestrictionTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VolumeRestrictionTransferManagerFactory contract was not deployed"
        );

        // STEP 6: Deploy the VolumeRestrictionTransferManager
        P_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {from:account_polymath});
        assert.notEqual(
            P_VolumeRestrictionTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VolumeRestrictionTransferManagerFactory contract was not deployed"
        );


         // Step 10: Deploy the STFactory contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // Step 11: Deploy the SecurityTokenRegistry contract

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 12: Deploy the proxy and attach the implementation contract to it.
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

        // Step 13: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});

        // // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the VolumeRestrictionTransferManagerFactory
        await I_MRProxied.registerModule(I_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the Paid VolumeRestrictionTransferManagerFactory
        await I_MRProxied.registerModule(P_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(P_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });


        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}
        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}
        VolumeDumpingRestrictionTransferManagerFactory: 
                                           ${I_VolumeRestrictionTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 60000000 });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(2, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

        });

    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(1000),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(1000),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('10', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should successfully attach the VolumeDumpingRestrictionTransferManager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the VolumeDumpingRestrictionTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._type.toNumber(), transferManagerKey, "VolumeDumpingTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "VolumeDumpingTransferManager",
                "VolumeDumpingTransferManagerFactory module was not added"
            );
            P_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the VolumeDumpingRestrictionTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_VolumeRestrictionTransferManagerFactory.address, 0, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), transferManagerKey, "VolumeDumpingTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "VolumeDumpingTransferManager",
                "VolumeDumpingTransferManager module was not added"
            );
            I_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[2].args._module);
        });

        it("Should pause the tranfers at transferManager level", async() => {
            let tx = await I_VolumeRestrictionTransferManager.pause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders up to limit", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should unpause the tranfers at transferManager level", async() => {
            await I_VolumeRestrictionTransferManager.unpause({from: token_owner});
        })

        let percent = 10
        let startTime = 0
        let endTime = latestTime() + duration.years(2);  
        let endTimeFn = (n=1) => latestTime() + duration.years(n);
        let rollingPeriod = 1000

        it("Should prevent creation of a dump restriction where rolling period is zero", async() => {
            let errorThrown = false
            try {
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTime, 0, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because rolling period is zero`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where end time is zero", async() => {
            let errorThrown = false
            try {
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, 0, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because end time is zero`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where percent is zero", async() => {
            let errorThrown = false
            try {
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, 0, startTime, endTime, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because percent is zero`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where percent is greater than 100", async() => {
            let errorThrown = false
            try {
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, 101, startTime, endTime, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because percent is greater than 100`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where the endtime is less than startime", async() => {
            let errorThrown = false
            try {
                let endTimeNegative = (await web3.eth.getBlock('latest')).timestamp - 10000
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTimeNegative, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because endTime is less than startime`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where the starttime is in the past", async() => {
            let errorThrown = false
            try {
                let startTimeNegative = (await web3.eth.getBlock('latest')).timestamp - 10000
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTimeNegative, endTime, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because start time is in the past`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent creation of a dump restriction where the rolling period is greater than endtime", async() => {
            let errorThrown = false
            try {
                let rollingPeriod = endTime + 10
                await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> couldn't create dumping restriction because rolling period is greater than endtime`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })

        it("Should create a dumping restriction", async() => {
            const tx = await I_VolumeRestrictionTransferManager.addDumpingRestriction(account_investor2, percent, 0, endTime, rollingPeriod, { from: token_owner });
            const logs = tx.logs[0]
            const startTime = (await web3.eth.getBlock('latest')).timestamp
            // check the add new dumping restriction event emitted
            assert.equal("AddNewVolumeDumping", logs['event'], "Invalid percent");
            assert.equal(endTime, logs['args']['endTime'], "Invalid end time");
            assert.equal(startTime, logs['args']['startTime'], "Invalid start time");
            assert.equal(rollingPeriod, logs['args']['rollingPeriod'], "Invalid rolling period");
        })

        it("Should allow transfer of multiple break up of tokens up to limit in a dumping restriction period", async() => {
            /**
             * Allows transfers up to 0.9 ether 
             * where user balance is 9 ether
             */
            await I_SecurityToken.changeGranularity(Math.pow(10, 15), {from: token_owner });

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.2', 'ether'), { from: account_investor2 });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.3', 'ether'), { from: account_investor2 });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('0.4', 'ether'), { from: account_investor2 });
        })

        it("Should get volume restriction details", async() => {
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner })
            assert.equal(percent, result[0].toNumber(), "Failed to modify the percent");
            assert.equal(endTime, result[2].toNumber(), "Failed to modify end time");
            assert.equal(rollingPeriod, result[3].toNumber(), "Failed to modify rolling period");
        })

        it("Should modify volume dumping restriction", async() => {
            let percent = 20
            let startTime = 0
            let endTime = latestTime() + duration.seconds(30);
            let rollingPeriod = 30

            await I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner });
            
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner });

            assert.equal(percent, result[0].toNumber(), "Failed to modify the percent");
            assert.equal(endTime, result[2].toNumber(), "Failed to modify end time");
            assert.equal(rollingPeriod, result[3].toNumber(), "Failed to modify rolling period");
        })

        it("Should prevent exceeding transfer of tokens in dumping restriction period", async() => {

            let errorThrown = false;

            try {
                let balance = (await I_SecurityToken.balanceOf(account_investor1)).toString()
                await I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 });

            } catch(error) {
                console.log(`       tx revert -> amount exceeded allowed amount of tokens in period`.grey);
                ensureException(error);
                errorThrown = true
            }
            assert.ok(errorThrown, message);
        })

        it("Should be possible to remove a dumping restriction", async() => {
            const tx = await I_VolumeRestrictionTransferManager.removeRestriction(account_investor2,  { from: token_owner });
            const log = tx.logs[0]
            assert.equal(log['event'], "RemoveVolumeDumping", "Failed to remove volume dumping restriction");
            
            const result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(account_investor2, { from: token_owner });

            assert.equal(0, result[0].toNumber(), "Failed to remove the dumping restriction");
            assert.equal(0, result[1].toNumber(), "Failed to remove the dumping restriction");
        });


        it("Should prevent modifying of a dump restriction where end time is in past", async() => {
            let errorThrown = false

            // increase evm time to 30 seconds
            increaseTime(30)

            let percent = 20
            let startTime = 0
            let endTime = latestTime() + duration.years(5);
            let rollingPeriod = 30

            try {
                await I_VolumeRestrictionTransferManager.modifyVolumeDumpingRestriction(account_investor2, percent, startTime, endTime, rollingPeriod, { from: token_owner });
            } catch (error) {
                console.log(`       tx revert -> counldn't modify a dump restriction because end time is in the past`.grey);
                ensureException(error);
                errorThrown = true
            }
            assert.ok(errorThrown, message);
        })

        it("Should prevent removing of a dump restriction where end time is in past", async() => {
            let errorThrown = false
            
            try {
               await I_VolumeRestrictionTransferManager.removeRestriction(account_investor2,  { from: token_owner });
            } catch(error) {
                console.log(`       tx revert -> couldn't remove dump restriction because end time is in the past`.grey);
                ensureException(error);
                errorThrown = true
            }
            assert.ok(errorThrown, message);
        })

        it("Should allow the transfer of all tokens in a dumping restriction if the end time has exceeded", async() => {
            let balance = (await I_SecurityToken.balanceOf(account_investor2)).toString()
            let endTime = latestTime() + duration.seconds(2);

            // transfering the remaning balance
            const result = await I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 });
            assert.equal(result.logs[0].event, "Transfer", message);
            assert.equal(result.logs[0].args['from'], account_investor2, message);
            assert.equal(result.logs[0].args['to'], account_investor1, message);
        })

        it("Should be possible to create multiple volume dumping restrictions at once", async() => {
            const accounts = [account_investor3, account_investor4]
            const percents  = [ 10, 20 ]
            const startTimes = [0, 0]
            const endTimes = [endTimeFn(1), endTimeFn(2)]
            const rollingPeriods = [10, 10]

            let result = await I_VolumeRestrictionTransferManager.addDumpingRestrictionMulti(accounts, percents, startTimes, endTimes, rollingPeriods, { from: token_owner });

            for(let account in accounts){
                result = await I_VolumeRestrictionTransferManager.getVolumeDumpingRestrictions(accounts[account], { from: token_owner });

                assert.equal(percents[account], result[0].toNumber(), "Failed to modify the percent");
                assert.equal(endTimes[account], result[2].toNumber(), "Failed to modify end time");
                assert.equal(rollingPeriods[account], result[3].toNumber(), "Failed to modify rolling period");
            }
        })

        it("Should revert if the parameters are bad when creating multiple volume dumping restrictions", async() => {
            let errorThrown = false
            try {
                const accounts = [account_investor3, account_investor4]
                const percents  = [ 10 ]
                const startTimes = [(await web3.eth.getBlock('latest')).timestamp+10, 0]
                const endTimes = [endTimeFn(1), endTimeFn(2)]
                const rollingPeriods = [30 ]
                await I_VolumeRestrictionTransferManager.addDumpingRestrictionMulti(
                    accounts, 
                    percents, 
                    startTimes, 
                    endTimes, 
                    rollingPeriods, 
                    { from: token_owner });

            } catch(error) {
                console.log(`       tx revert -> passed in wrong number of array elements`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        })


        it("Should get configuration function signature", async() => {
            let sig = await I_VolumeRestrictionTransferManager.getInitFunction.call();
            assert.equal(web3.utils.hexToNumber(sig), 0);
        });

        it("Should get the permission", async() => {
            let perm = await I_VolumeRestrictionTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

    });

    describe("VolumeDumping Restriction Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.setupCost.call(),0);
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getType.call(),2);
            assert.equal(web3.utils.toAscii(await I_VolumeRestrictionTransferManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "VolumeDumpingTransferManager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getDescription.call(),
                        "Manage the volume of tokens dumpable by an owner",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getTitle.call(),
                        "Volume Dumping Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getInstructions.call(),
                        "Allows an issuer to restrict the total number of tokens dumpable withing a rolling period",
                        "Wrong Module added");
        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_VolumeRestrictionTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "VolumeDumping");
        });
    });

});
