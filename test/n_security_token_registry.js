import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryMock = artifacts.require('./SecurityTokenRegistryMock.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyToken = artifacts.require('./PolyToken.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('SecurityTokenRegistry', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;
    let dummy_token;

    let balanceOfReceiver;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(100);

    let ID_snap;
    const message = "Transaction Should Fail!!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_SecurityTokenRegistryV2;
    let I_DummySTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_DummySTO;
    let I_PolyToken;
    let I_STFactory;
    let I_STFactory002;
    let I_SecurityToken002;
    let I_STFactory003;
    let I_PolymathRegistry;
    let I_SecurityTokenRegistryProxy;
    let I_STRProxied;
    let I_MRProxied;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    //Security Token Detials (Version 2)
    const name2 = "Demo2 Token";
    const symbol2 = "DET2";
    const tokenDetails2 = "This is equity type of issuance";

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");
    const newRegFee =  web3.utils.toWei("300");

    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];
    const STOParameters = ['uint256', 'uint256', 'uint256', 'string'];

     // Capped STO details
     const cap = web3.utils.toWei("10000");
     const someString = "Hello string";

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
        token_owner = account_issuer;
        dummy_token = accounts[3];

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

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: account_polymath });

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: account_polymath });

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );


        // Step 6: Deploy the STversionProxy contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // STEP 8: Deploy the CappedSTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 1000 * Math.pow(10, 18), 0, 0,{ from: token_owner });

        assert.notEqual(
            I_DummySTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TestSTOFactory contract was not deployed"
        );

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 9 (a): Deploy the proxy
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

         // Step 10: Deploy the FeatureRegistry

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

        //Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});

        // STEP 4: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_MRProxied.registerModule(I_DummySTOFactory.address, { from: account_polymath });

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

        DummySTOFactory:                  ${I_DummySTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });


    describe(" Test cases of the registerTicker", async() => {

        it("verify the intial parameters", async() => {
            let intialised = await I_STRProxied.getBoolValues.call(web3.utils.soliditySha3("initialised"));
            assert.isTrue(intialised, "Should be true");

            let expiry = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("expiryLimit"));
            assert.equal(expiry.toNumber(), 5184000, "Expiry limit should be equal to 60 days");

            let polytoken = await I_STRProxied.getAddressValues.call(web3.utils.soliditySha3("polyToken"));
            assert.equal(polytoken, I_PolyToken.address, "Should be the polytoken address");

            let stlaunchFee = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("stLaunchFee"));
            assert.equal(stlaunchFee.toNumber(), initRegFee, "Should be provided reg fee");

            let tickerRegFee = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("tickerRegFee"));
            assert.equal(tickerRegFee.toNumber(), tickerRegFee, "Should be provided reg fee");

            let polymathRegistry = await I_STRProxied.getAddressValues.call(web3.utils.soliditySha3("polymathRegistry"));
            assert.equal(polymathRegistry, I_PolymathRegistry.address, "Should be the address of the polymath registry");

            let owner = await I_STRProxied.getAddressValues.call(web3.utils.soliditySha3("owner"));
            assert.equal(owner, account_polymath, "Should be the address of the registry owner");
        });

        it("Can't call the intialize function again", async() => {
            let errorThrown = false;
            try {
                 await I_STRProxied.initialize(I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath);
            } catch(error) {
                console.log(`         tx revert -> Can't call the intialize function again`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should fail to register ticker if tickerRegFee not approved", async() => {
            let errorThrown = false;
            try {
                let tx = await I_STRProxied.registerTicker(account_temp, symbol, name, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> POLY allowance not provided for registration fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to register ticker if owner is 0x", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.getTokens(initRegFee, account_temp);
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
                let tx = await I_STRProxied.registerTicker("0x0000000000000000000000000000000000000000", symbol, name, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> owner should not be 0x`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to register ticker due to the symbol length is 0", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
                let tx = await I_STRProxied.registerTicker(account_temp, "", name, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> Symbol Length is 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to register ticker due to the symbol length is greater than 10", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
                let tx = await I_STRProxied.registerTicker(account_temp, "POLYMATHNET", name, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> Symbol Length is greater than 10`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_STRProxied.registerTicker(account_temp, symbol, name, { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, symbol, `Symbol should be ${symbol}`);
        });

        it("Should fail to register same symbol again", async() => {
            // Give POLY to token issuer
            await I_PolyToken.getTokens(initRegFee, token_owner);

            // Call registration function
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Symbol is already alloted to someone else`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register pre registerd ticker if expiry is reached", async() => {
            await increaseTime(5184000 + 100); // 60(5184000) days of expiry + 100 sec for buffer
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, symbol, `Symbol should be ${symbol}`);
        });

        it("Should fail to register ticker if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.pause({ from: account_polymath});
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let tx = await I_STRProxied.registerTicker(token_owner, "AAA", name, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to pause if already paused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.pause({ from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Registration is already paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register ticker if registration is unpaused", async() => {
            await I_STRProxied.unpause({ from: account_polymath});
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, "AAA", name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, "AAA", `Symbol should be AAA`);
        });

        it("Should fail to unpause if already unpaused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.unpause({ from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Registration is already unpaused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Test cases for the expiry limit", async() => {

        it("Should fail to set the expiry limit because msg.sender is not owner", async() => {
            let errorThrown = false;
            try {
                let tx = await I_STRProxied.changeExpiryLimit(duration.days(10), {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully set the expiry limit", async() => {
            await I_STRProxied.changeExpiryLimit(duration.days(10), {from: account_polymath});
            assert.equal(
                (await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("expiryLimit")))
                .toNumber(),
                duration.days(10),
                "Failed to change the expiry limit");
        });

        it("Should fail to set the expiry limit because new expiry limit is lesser than one day", async() => {
            let errorThrown = false;
            try {
                let tx = await I_STRProxied.changeExpiryLimit(duration.seconds(5000), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> New expiry limit is lesser than one day`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Test cases for the getTickerDetails", async() => {

        it("Should get the details of the symbol", async() => {
            let tx = await I_STRProxied.getTickerDetails.call(symbol);
            assert.equal(tx[0], token_owner, "Should equal to the rightful owner of the ticker");
            assert.equal(tx[3], name, `Name of the token should equal to ${name}`);
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });

        it("Should get the details of unregistered token", async() => {
            let tx = await I_STRProxied.getTickerDetails.call("TORO");
            assert.equal(tx[0], "0x0000000000000000000000000000000000000000", "Should be 0x as ticker is not exists in the registry");
            assert.equal(tx[3], "", "Should be an empty string");
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });
    });

    describe("Generate SecurityToken", async() => {

        it("Should get the ticker details successfully and prove the data is not storing in to the logic contract", async() => {
            let data = await I_STRProxied.getTickerDetails(symbol, {from: token_owner});
            assert.equal(data[0], token_owner, "Token owner should be equal");
            assert.equal(data[3], name, "Name of the token should match with the registered symbol infor");
            assert.equal(data[4], false, "Token is not launched yet so it should return False");
            data = await I_SecurityTokenRegistry.getTickerDetails(symbol, {from:token_owner});
            console.log("This is the data from the original securityTokenRegistry contract");
            assert.equal(data[0], '0x0000000000000000000000000000000000000000', "Token owner should be 0x");
        })

        it("Should fail to generate new security token if fee not provided", async() => {
            let errorThrown = false;
            await I_PolyToken.approve(I_STRProxied.address, 0, { from: token_owner});
            try {
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> POLY allowance not provided for registration fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to generate token if registration is paused", async() => {
            let errorThrown = false;
            await I_STRProxied.pause({ from: account_polymath});
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            try {
                await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to generate the securityToken -- Because ticker length is 0", async() => {
            let errorThrown = false;
            await I_STRProxied.unpause({ from: account_polymath});
            try {
                await I_STRProxied.generateSecurityToken(name, "", tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Zero ticker length is not allowed`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should fail to generate the securityToken -- Because name length is 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.generateSecurityToken("", symbol, tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> 0 name length is not allowed`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should fail to generate the securityToken -- Because msg.sender is not the rightful owner of the ticker", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.generateSecurityToken("", symbol, tokenDetails, false, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> Because msg.sender is not the rightful owner of the ticker`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should generate the new security token with the same symbol as registered above", async () => {
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTrasnferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey, `Should be equal to the ${transferManagerKey}`);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should fail to generate the SecurityToken when token is already deployed with the same symbol", async() => {
            let errorThrown = false;
            try {
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Because ticker is already in use`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

    });

    describe("Generate SecurityToken v2", async() => {

        it("Should deploy the st version 2", async() => {
            // Step 7: Deploy the STFactory contract

            I_STFactory002 = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

            assert.notEqual(
                I_STFactory002.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "STFactory002 contract was not deployed",
            );
            await I_STRProxied.setProtocolVersion(I_STFactory002.address, 0, 2, 0, { from: account_polymath });
            let _protocol = await I_STRProxied.getProtocolVersion.call();
            assert.equal(_protocol[0], 0);
            assert.equal(_protocol[1], 2);
            assert.equal(_protocol[2], 0);
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol2, name2, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Token owner should be ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, symbol2, `Symbol should be ${symbol2}`);
        });

        it("Should generate the new security token with version 2", async() => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name2, symbol2, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol2, "SecurityToken doesn't get deployed");

            I_SecurityToken002 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            let tokens = await I_STRProxied.getTokensByOwner.call(token_owner);
            assert.equal(tokens[0], I_SecurityToken.address);
            assert.equal(tokens[1], I_SecurityToken002.address);

            const log = await promisifyLogWatch(I_SecurityToken002.ModuleAdded({from: _blockNo}), 1);
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

    });

    describe("Deploy the new SecurityTokenRegistry", async() => {

        it("Should deploy the new SecurityTokenRegistry contract logic", async() => {
            I_SecurityTokenRegistryV2 = await SecurityTokenRegistryMock.new({ from: account_polymath });
            assert.notEqual(
                I_SecurityTokenRegistryV2.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "SecurityTokenRegistry contract was not deployed",
            );
        });

        it("Should fail to upgrade the logic contract of the STRProxy -- bad owner", async() => {
            let errorThrown = false;
            await I_STRProxied.pause({from: account_polymath});
            try {
                await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryV2.address, {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> bad owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should upgrade the logic contract into the STRProxy", async() =>{
            await I_SecurityTokenRegistryProxy.upgradeTo("1.1.0", I_SecurityTokenRegistryV2.address, {from: account_polymath});
            I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
            assert.isTrue(await I_STRProxied.getBoolValues.call(web3.utils.soliditySha3("paused")), "Paused value should be false");
        });

        it("Should check the old data persist or not", async() => {
            let data = await I_STRProxied.getTickerDetails.call(symbol);
            assert.equal(data[0], token_owner, "Should be equal to the token owner address");
            assert.equal(data[3], name, "Should be equal to the name of the token that is provided earlier");
            assert.isTrue(data[4], "Token status should be deployed == true");
        });

        it("Should unpause the logic contract", async() => {
            await I_STRProxied.unpause({from: account_polymath});
            assert.isFalse(await I_STRProxied.getBoolValues.call(web3.utils.soliditySha3("paused")), "Paused value should be false");
        });
    })

    describe("Generate custom tokens", async() => {

        it("Should fail if msg.sender is not polymath", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifySecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", latestTime(), {from: account_delegate});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not polymath account`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to generate the custom security token -- name should not be 0 length ", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifySecurityToken("", "LOG", account_temp, dummy_token, "I am custom ST", latestTime(), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> name should not be 0 length `.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail if ST address is 0 address", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifySecurityToken("LOGAN", "LOG", account_temp, 0, "I am custom ST", latestTime(), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Security token address is 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail if symbol length is 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifySecurityToken("", "", account_temp, dummy_token, "I am custom ST",latestTime(), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> zero length of the symbol is not allowed`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to generate the custom ST -- deployedAt param is 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifySecurityToken(name2, symbol2, token_owner, dummy_token, "I am custom ST", 0, {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> because deployedAt param is 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully generate custom token", async() => {
            // Register the new ticker -- Fulfiling the TickerStatus.ON condition
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
            let tickersListArray = await I_STRProxied.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            await I_STRProxied.registerTicker(account_temp, "LOG", "LOGAN", { from : account_temp });
            tickersListArray = await I_STRProxied.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            // Generating the ST
            let tx = await I_STRProxied.modifySecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", latestTime(), {from: account_polymath});
            tickersListArray = await I_STRProxied.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            assert.equal(tx.logs[1].args._ticker, "LOG", "Symbol should match with the registered symbol");
            assert.equal(tx.logs[1].args._securityTokenAddress, dummy_token,`Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`);
            let symbolDetails = await I_STRProxied.getTickerDetails("LOG");
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[3], "LOGAN", `Name of the symbol should be LOGAN`);
        });

        it("Should successfully generate the custom token", async() => {
            // Fulfilling the TickerStatus.NN condition
            // let errorThrown = false;
            // try {
            //     await I_STRProxied.modifySecurityToken("LOGAN2", "LOG2", account_temp, dummy_token, "I am custom ST", latestTime(), {from: account_polymath});
            // } catch(error) {
            //     console.log(`         tx revert -> because ticker not registered`.grey);
            //     errorThrown = true;
            //     ensureException(error);
            // }
            // assert.ok(errorThrown, message);
            // await I_STRProxied.modifyTicker(account_temp, "LOG2", "LOGAN2", latestTime(), latestTime() + duration.days(10), false, {from: account_polymath});
            // await increaseTime(duration.days(1));
            let tx = await I_STRProxied.modifySecurityToken("LOGAN2", "LOG2", account_temp, dummy_token, "I am custom ST", latestTime(), {from: account_polymath});
            assert.equal(tx.logs[1].args._ticker, "LOG2", "Symbol should match with the registered symbol");
            assert.equal(tx.logs[1].args._securityTokenAddress, dummy_token, `Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`);
            assert.equal(tx.logs[0].args._owner, account_temp, `Token owner should be ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "LOG2", `Symbol should be LOG2`);
            let symbolDetails = await I_STRProxied.getTickerDetails("LOG2");
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[3], "LOGAN2", `Name of the symbol should be LOGAN`);
        });

    });

    describe("Test case for modifyTicker", async() => {

        it("Should add the custom ticker --failed because of bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifyTicker(token_owner, "ETH", "Ether", latestTime(), (latestTime() + duration.days(10)), false, {from: account_temp})
            } catch(error) {
                console.log(`         tx revert -> failed beacause ticker length should not be 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should add the custom ticker --fail ticker length should not be 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifyTicker(token_owner, "", "Ether", latestTime(), (latestTime() + duration.days(10)), false, {from: account_polymath})
            } catch(error) {
                console.log(`         tx revert -> failed beacause ticker length should not be 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should add the custom ticker --failed because time should not be 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifyTicker(token_owner, "ETH", "Ether", 0, (latestTime() + duration.days(10)), false, {from: account_polymath})
            } catch(error) {
                console.log(`         tx revert -> failed because time should not be 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should add the custom ticker --failed because registeration date is greater than the expiryDate", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifyTicker(token_owner, "ETH", "Ether", latestTime(), (latestTime() - duration.minutes(10)), false, {from: account_polymath})
            } catch(error) {
                console.log(`         tx revert -> failed because registeration date is greater than the expiryDate`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should add the custom ticker --failed because owner should not be 0x", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.modifyTicker("0x000000000000000000000000000000000000000000", "ETH", "Ether", latestTime(), (latestTime() + duration.minutes(10)), false, {from: account_polymath})
            } catch(error) {
                console.log(`         tx revert -> failed because owner should not be 0x`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should add the new custom ticker", async() => {
            let tx = await I_STRProxied.modifyTicker(account_temp, "ETH", "Ether", latestTime(), (latestTime() + duration.minutes(10)), false, {from: account_polymath});
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "ETH", "Should be equal to ETH");
        })

        it("Should change the details of the existing ticker", async() => {
            let tx = await I_STRProxied.modifyTicker(token_owner, "ETH", "Ether", latestTime(), (latestTime() + duration.minutes(10)), false, {from: account_polymath});
            assert.equal(tx.logs[0].args._owner, token_owner);
        });

    });

    describe("Test cases for the transferTickerOwnership()", async() => {

        it("Should able to transfer the ticker ownership -- failed because token is not deployed having the same ticker", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.transferTickerOwnership(account_issuer, "ETH", {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> failed because token is not deployed having the same ticker`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should able to transfer the ticker ownership -- failed because new owner is 0x", async() => {
            let errorThrown = false;
            await I_SecurityToken002.transferOwnership(account_temp, {from: token_owner});
            try {
                await I_STRProxied.transferTickerOwnership("0x00000000000000000000000000000000000000000", symbol2, {from: token_owner});
            } catch(error) {
                console.log(`         tx revert -> failed because new owner is 0x`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should able to transfer the ticker ownership -- failed because ticker is of zero length", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.transferTickerOwnership(account_temp, "", {from: token_owner});
            } catch(error) {
                console.log(`         tx revert -> failed because ticker is of zero length`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should able to transfer the ticker ownership", async() => {
            let tx = await I_STRProxied.transferTickerOwnership(account_temp, symbol2, {from: token_owner, gas: 5000000 });
            assert.equal(tx.logs[0].args._newOwner, account_temp);
            let symbolDetails = await I_STRProxied.getTickerDetails.call(symbol2);
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[3], name2, `Name of the symbol should be ${name2}`);
        })
    })

    describe("Test case for the changeSecurityLaunchFee()", async() => {

        it("Should able to change the STLaunchFee-- failed because of bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeSecurityLaunchFee(web3.utils.toWei("500"), {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> failed because of bad owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the STLaunchFee-- failed because of putting the same fee", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeSecurityLaunchFee(initRegFee, {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> failed because of putting the same fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the STLaunchFee", async() => {
            let tx = await I_STRProxied.changeSecurityLaunchFee(web3.utils.toWei("500"), {from: account_polymath});
            assert.equal(tx.logs[0].args._newFee, web3.utils.toWei("500"));
            let stLaunchFee = await I_STRProxied.getUintValues(web3.utils.soliditySha3("stLaunchFee"));
            assert.equal(stLaunchFee, web3.utils.toWei("500"));
        });

    })

    describe("Test cases for the changeExpiryLimit()", async() => {

        it("Should able to change the ExpiryLimit-- failed because of bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeExpiryLimit(duration.days(15), {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> failed because of bad owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the ExpiryLimit-- failed because expirylimit is less than 1 day", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeExpiryLimit(duration.minutes(50), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> failed because expirylimit is less than 1 day`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the ExpiryLimit", async() => {
            let tx = await I_STRProxied.changeExpiryLimit(duration.days(20), {from: account_polymath});
            assert.equal(tx.logs[0].args._newExpiry, duration.days(20));
            let expiry = await I_STRProxied.getUintValues(web3.utils.soliditySha3("expiryLimit"));
            assert.equal(expiry, duration.days(20));
        });
    })

    describe("Test cases for the changeTickerRegistrationFee()", async() => {

        it("Should able to change the TickerRegFee-- failed because of bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeTickerRegistrationFee(web3.utils.toWei("500"), {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> failed because of bad owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the TickerRegFee-- failed because of putting the same fee", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.changeTickerRegistrationFee(initRegFee, {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> failed because of putting the same fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should able to change the TickerRegFee", async() => {
            let tx = await I_STRProxied.changeTickerRegistrationFee(web3.utils.toWei("400"), {from: account_polymath});
            assert.equal(tx.logs[0].args._newFee, web3.utils.toWei("400"));
            let tickerRegFee = await I_STRProxied.getUintValues(web3.utils.soliditySha3("tickerRegFee"));
            assert.equal(tickerRegFee, web3.utils.toWei("400"));
        });

        it("Should fail to register the ticker with the old fee", async () => {
            let errorThrown = false;
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            try {
                await I_STRProxied.registerTicker(token_owner, "POLY", "Polymath", { from : token_owner });
            } catch(error) {
                console.log(`         tx revert -> failed because of ticker registeration fee gets change`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should register the ticker with the new fee", async() => {
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("500"), { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, "POLY", "Polymath", { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Token owner should be ${token_owner}`);
            assert.equal(tx.logs[0].args._ticker, "POLY", `Symbol should be POLY`);
        });

        it("Should fail to launch the securityToken with the old launch fee", async() => {
            let errorThrown = false;
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            try {
                await I_STRProxied.generateSecurityToken("Polymath", "POLY", tokenDetails, false, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> failed because of old launch fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should launch the the securityToken", async() => {
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("500"), { from: token_owner});
            let tx = await I_STRProxied.generateSecurityToken("Polymath", "POLY", tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, "POLY", "SecurityToken doesn't get deployed");
        });
    });

    describe("Test case for the update poly token", async() => {

        it("Should change the polytoken address -- failed because of bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.updatePolyTokenAddress(dummy_token, {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> failed because of bad owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should change the polytoken address -- failed because of 0x address", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.updatePolyTokenAddress("0x0000000000000000000000000000000000000000000", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> failed because 0x address`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should successfully change the polytoken address", async() => {
            let _id = await takeSnapshot();
            await I_STRProxied.updatePolyTokenAddress(dummy_token, {from: account_polymath});
            assert.equal(await I_STRProxied.getAddressValues.call(web3.utils.soliditySha3("polyToken")), dummy_token);
            await revertToSnapshot(_id);
        });
    })

    describe("Test cases for getters", async() => {

        it("Should get the security token address", async() => {
           let address = await I_STRProxied.getSecurityTokenAddress.call(symbol);
           assert.equal(address, I_SecurityToken.address);
        });

        it("Should get the security token data", async() => {
            let data = await I_STRProxied.getSecurityTokenData.call(I_SecurityToken.address);
            assert.equal(data[0], symbol);
            assert.equal(data[1], token_owner);
        });

        it("Should get the tickers by owner", async() => {
            let tickersList = await I_STRProxied.getTickersByOwner.call(token_owner);
            assert.equal(tickersList.length, 4);
            let tickersListArray = await I_STRProxied.getTickersByOwner.call(account_temp);
            console.log(tickersListArray);
            assert.equal(tickersListArray.length, 3);
        });

    });

    describe("Test case for the Removing the ticker", async() => {

        it("Should remove the ticker from the polymath ecosystem -- bad owner", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.removeTicker(symbol2, {from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> failed because msg.sender should be account_polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should remove the ticker from the polymath ecosystem -- fail because ticker doesn't exist in the ecosystem", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.removeTicker("HOLA", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> failed because ticker doesn't exist in the polymath ecosystem`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should successfully remove the ticker from the polymath ecosystem", async() => {
            let tx = await I_STRProxied.removeTicker(symbol2, {from: account_polymath});
            assert.equal(tx.logs[0].args._ticker, symbol2, "Ticker doesn't get deleted successfully");
        });
    })

    describe(" Test cases of the registerTicker", async() => {

        it("Should register the ticker 1", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("1000"), { from: account_temp});
            let tx = await I_STRProxied.registerTicker(account_temp, "TOK1", "", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK1", `Symbol should be TOK1`);
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        });

        it("Should register the ticker 2", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("1000"), { from: account_temp});
            let tx = await I_STRProxied.registerTicker(account_temp, "TOK2", "", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK2", `Symbol should be TOK2`);
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        });

        it("Should register the ticker 3", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("1000"), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("1000"), { from: account_temp});
            let tx = await I_STRProxied.registerTicker(account_temp, "TOK3", "", { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK3", `Symbol should be TOK3`);
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        });

        it("Should successfully remove the ticker 2", async() => {
            let tx = await I_STRProxied.removeTicker("TOK2", {from: account_polymath});
            assert.equal(tx.logs[0].args._ticker, "TOK2", "Ticker doesn't get deleted successfully");
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        });

        it("Should modify ticker 1", async() => {
            let tx = await I_STRProxied.modifyTicker(account_temp, "TOK1", "TOKEN 1", latestTime(), (latestTime() + duration.minutes(10)), false, {from: account_polymath});
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK1", "Should be equal to TOK1");
            assert.equal(tx.logs[0].args._name, "TOKEN 1", "Should be equal to TOKEN 1");
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        })

        it("Should modify ticker 3", async() => {
            let tx = await I_STRProxied.modifyTicker(account_temp, "TOK3", "TOKEN 3", latestTime(), (latestTime() + duration.minutes(10)), false, {from: account_polymath});
            assert.equal(tx.logs[0].args._owner, account_temp, `Should be equal to the ${account_temp}`);
            assert.equal(tx.logs[0].args._ticker, "TOK3", "Should be equal to TOK3");
            assert.equal(tx.logs[0].args._name, "TOKEN 3", "Should be equal to TOKEN 3");
            console.log((await I_STRProxied.getTickersByOwner.call(account_temp)).map(x => web3.utils.toAscii(x)));
        })

    });
    describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for reclaiming funds", async() => {

            it("Should successfully reclaim POLY tokens", async() => {
                I_PolyToken.transfer(I_STRProxied.address, web3.utils.toWei("1"), { from: token_owner });
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_STRProxied.reclaimERC20(I_PolyToken.address);
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(bal2.dividedBy(new BigNumber(10).pow(18)).toNumber(), bal2.dividedBy(new BigNumber(10).pow(18)).toNumber());
            });

        });

        describe("Test cases for pausing the contract", async() => {

            it("Should fail to pause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_STRProxied.pause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully pause the contract", async() => {
                await I_STRProxied.pause({ from: account_polymath });
                let status = await I_STRProxied.getBoolValues.call(web3.utils.soliditySha3("paused"));
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_STRProxied.unpause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully unpause the contract", async() => {
                await I_STRProxied.unpause({ from: account_polymath });
                let status = await I_STRProxied.getBoolValues.call(web3.utils.soliditySha3("paused"));
                assert.isNotOk(status);
            });

        });

    });

});
