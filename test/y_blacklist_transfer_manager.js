import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
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
const BlacklistTransferManagerFactory = artifacts.require('./BlacklistTransferManagerFactory.sol');
const BlacklistTransferManager = artifacts.require('./BlacklistTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');   
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('BlacklistTransferManager', accounts => {

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
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_BlacklistTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_BlacklistTransferManager;
    let P_BlacklistTransferManagerFactory;
    let P_BlacklistTransferManager;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
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
    const initRegFee = web3.utils.toWei("250");

    // BlacklistTransferManager details
    const holderCount = 2;           // Maximum number of token holders
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];
    let bytesSTO = encodeModuleCall(['uint256'], [holderCount]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[5];
        account_investor5 = accounts[6];

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

        assert.notEqual(
            I_FeatureRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FeatureRegistry contract was not deployed",
        );
        
         // STEP 3: Deploy the ModuleRegistry
     
        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});
        // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);


        // STEP 4: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 5: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 6: Deploy the BlacklistTransferManager
        I_BlacklistTransferManagerFactory = await BlacklistTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_BlacklistTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "BlacklistTransferManagerFactory contract was not deployed"
        );

        // STEP 7: Deploy Paid the CountTransferManager
        P_BlacklistTransferManagerFactory = await BlacklistTransferManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {from:account_polymath});
        assert.notEqual(
            P_BlacklistTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "BlacklistTransferManagerFactory contract was not deployed"
        );

        // Step 9: Deploy the STFactory contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // Step 10: Deploy the SecurityTokenRegistry

        // Deploy the SecurityTokenregistry
        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 11: Deploy the proxy and attach the implementation contract
         I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
         let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
         await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
         I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);   
        
        // Step 12: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});

         // STEP 8: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the BlacklistTransferManagerFactory
        await I_MRProxied.registerModule(I_BlacklistTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_BlacklistTransferManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the Paid BlacklistTransferManagerFactory
        await I_MRProxied.registerModule(P_BlacklistTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(P_BlacklistTransferManagerFactory.address, true, { from: account_polymath });

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        ModuleRegistryProxy:               ${ModuleRegistryProxy.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        BlacklistTransferManagerFactory:   ${I_BlacklistTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

        });

        it("Should successfully attach the BlacklistTransferManager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_BlacklistTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the BlacklistTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_BlacklistTransferManagerFactory.address, bytesSTO, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "BlacklistTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "BlacklistTransferManager",
                "BlacklistTransferManagerFactory module was not added"
            );
            P_BlacklistTransferManager = BlacklistTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the BlacklistTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_BlacklistTransferManagerFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "BlacklistTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "BlacklistTransferManager",
                "BlacklistTransferManager module was not added"
            );
            I_BlacklistTransferManager = BlacklistTransferManager.at(tx.logs[2].args._module);
        });

    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(50),
                true,
                {
                    from: account_issuer
                });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");
            
            // Jump time
            await increaseTime(5000);
            
            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('3', 'ether'), { from: token_owner });
            
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('3', 'ether')
            );
            
        });

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(50),
                true,
                {
                    from: account_issuer
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should add the blacklist", async() => {
            //Add the new blacklist
            let tx = await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "a_blacklist", 20, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), "a_blacklist", "Failed in adding the type in blacklist");
        });

        it("Should fail in adding the blacklist as blacklist type already exist", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "a_blacklist", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Blacklist type already exist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the blacklist as the blacklist name is invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid blacklist name`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the blacklist as the dates are invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addBlacklistType(latestTime()+4000, latestTime()+3000, "b_blacklist", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid start or end date`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the blacklist as repeat in days is invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "b_blacklist", 0, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid repeat in days`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the blacklist because only owner can add the blacklist", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "b_blacklist", 20, { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to add the blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });


        it("Should modify the blacklist", async() => {
            //Modify the existing blacklist
            let tx = await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+2000, latestTime()+3000, "a_blacklist", 20, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), "a_blacklist", "Failed in modifying the startdate of blacklist");

        });

        it("Should fail in modifying the blacklist as the name is invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+2000, latestTime()+3000, "", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid blacklist name`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in modifying the blacklist as the dates are invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+4000, latestTime()+3000, "b_blacklist", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid start or end date`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in modifying the blacklist as the repeat in days is invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+2000, latestTime()+3000, "b_blacklist", 0, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid repeat in days`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });


        it("Should fail in modifying the blacklist as only owner can modify the blacklist", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+1000, latestTime()+3000, "a_blacklist", 20, { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to modify the blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in modifying the blacklist as blacklist type doesnot exist", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.modifyBlacklistType(latestTime()+1000, latestTime()+3000, "b_blacklist", 20, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Blacklist type doesnot exist`.grey);
                errorThrown = true;
                ensureException(error);
            }   
            assert.ok(errorThrown, message);
        });

        it("Should add investor to the blacklist", async() => {
            //Add investor to the existing blacklist
            let tx = await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, "a_blacklist", { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor to the blacklist");

        });

        it("Should fail in adding the investor to the blacklist because only owner can add the investor", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, "a_blacklist", { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to add the investor to the blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the investor to the blacklist as investor address is invalid", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addInvestorToBlacklist(0x0, "a_blacklist", { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid investor address`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });


        it("Should fail in adding the investor to the non existing blacklist", async() => {
            let errorThrown = false;
            try {
                await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor2, "b_blacklist", { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Trying to add the investor in non existing blacklist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should get the list of investors associated to blacklist", async() => {
            let perm = await I_BlacklistTransferManager.getListOfAddresses.call("a_blacklist");
            assert.equal(perm.length, 1);
        });

        it("Should fail in getting the list of investors from the non existing blacklist", async() => {
            let errorThrown = false;
            try{
                let perm = await I_BlacklistTransferManager.getListOfAddresses.call("b_blacklist");
            }   
            catch(error){
                console.log(`         tx revert -> Trying to get the list of investors of non existing blacklist`.grey);
                errorThrown = true;
                ensureException(error);
            } 
            assert.ok(errorThrown, message);
        });

        it("Should investor be able to transfer token as it is not in blacklist time period", async() => {
            // Jump time
            await increaseTime(4000);
            
            //Trasfer tokens
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('3', 'ether')
            );
        });

        it("Should fail in transfer the tokens as the investor in blacklist", async() => {
            let errorThrown = false;
            // Jump time
            await increaseTime(1727500);
            try{
                await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            }
            catch(error){
                console.log(`         tx revert -> Trying to send token by the blacklisted address`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

       

        it("Should delete the blacklist type", async() => {
            await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "b_blacklist", 20, { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteBlacklistType("b_blacklist", { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), "b_blacklist", "Failed in deleting the blacklist");

        });

        it("Only owner have the permission to delete thr blacklist type", async() => {
            await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "b_blacklist", 20, { from: token_owner });
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteBlacklistType("b_blacklist", { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to delete the blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in deleting the blacklist type as the blacklist has associated addresses", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteBlacklistType("a_blacklist", { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Not able to delete the blacklist as blacklist has associated addresses.`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in deleting the blacklist type as the blacklist doesnot exist", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteBlacklistType("c_blacklist", { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Not able to delete the blacklist as blacklist type doesnot exist.`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should delete the investor from all the associated blacklist", async() => {
            await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "g_blacklist", 20, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, "g_blacklist", { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor1, { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in deleting the investor from the blacklist");

        });

        it("Only owner has the permission to delete the investor from all the blacklist type", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, "a_blacklist", { from: token_owner });
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor1, { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to delete the investor from blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in deleting the investor from all the associated blacklist as th address is invalid", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(0x0, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Invalid investor address`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in deleting the investor which is not associated to blacklist", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteInvestorFromAllBlacklist(account_investor2, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Investor is not associated to blacklist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should delete the investor from the blacklist type", async() => {
            await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "f_blacklist", 20, { from: token_owner });
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, "f_blacklist", { from: token_owner });
            let tx = await I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, "f_blacklist", { from: token_owner });
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in deleting the investor from the blacklist");

        });

        it("Only owner can delete the investor from the blacklist type", async() => {
            await I_BlacklistTransferManager.addInvestorToBlacklist(account_investor1, "f_blacklist", { from: token_owner });
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.deleteInvestorFromBlacklist(account_investor1, "f_blacklist", { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to delete the investor from blacklist type`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should add investor and new blacklist type", async() => {
            let tx = await I_BlacklistTransferManager.addInvestorToNewBlacklist(latestTime()+1000, latestTime()+3000, "c_blacklist", 20, account_investor3, { from: token_owner });
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), "c_blacklist", "Failed in adding the blacklist");
            assert.equal(tx.logs[1].args._investor, account_investor3, "Failed in adding the investor to blacklist");

        });

        it("Should fail in adding the investor and new blacklist type", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.addInvestorToNewBlacklist(latestTime()+1000, latestTime()+3000, "c_blacklist", 20, account_investor3, { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to add the investor to blacklist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should add mutiple investor to blacklist", async() => {
            await I_BlacklistTransferManager.addBlacklistType(latestTime()+1000, latestTime()+3000, "d_blacklist", 20, { from: token_owner });
            let investor = [account_investor4,account_investor5];
            let tx = await I_BlacklistTransferManager.addInvestorToBlacklistMulti([account_investor4,account_investor5], "d_blacklist", { from: token_owner });
            
            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let user = event_data[i].args._investor;
                assert.equal(user, investor[i], "Failed in adding the investor to blacklist");
            }
        
        });

        it("Should fail in adding the mutiple investor to the blacklist", async() => {
            let errorThrown = false;
            try {
                let tx = await I_BlacklistTransferManager.addInvestorToBlacklistMulti([account_investor4,account_investor5], "b_blacklist", { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> Only owner have the permission to add the investors to blacklist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should get the init function", async() => {
            let byte = await I_BlacklistTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ''), 0);
        });

        it("Should get the permission", async() => {
            let perm = await I_BlacklistTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });


    });

    describe("Test cases for the factory", async() => {
        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_BlacklistTransferManagerFactory.setupCost.call(),0);
            assert.equal((await I_BlacklistTransferManagerFactory.getTypes.call())[0],2);
            assert.equal(web3.utils.toAscii(await I_BlacklistTransferManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "BlacklistTransferManager",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.getDescription.call(),
                        "Automate blacklist to restrict selling",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.getTitle.call(),
                        "Blacklist Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_BlacklistTransferManagerFactory.getInstructions.call(),
                        "Allows an issuer to blacklist the addresses.",
                        "Wrong Module added");
        
        });
        
        it("Should get the tags of the factory", async() => {
            let tags = await I_BlacklistTransferManagerFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Blacklist");
            });
    });

});
