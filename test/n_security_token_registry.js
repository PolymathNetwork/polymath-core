import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryMock = artifacts.require('./SecurityTokenRegistryMock.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const STVersion002 = artifacts.require('./STVersionProxy002.sol');
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
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_SecurityTokenRegistryV2;
    let I_DummySTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_DummySTO;
    let I_PolyToken;
    let I_STVersion002;
    let I_SecurityToken002;
    let I_STVersion003;
    let I_PolymathRegistry;
    let I_SecurityTokenRegistryProxy;
    let I_STRProxied;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    //Security Token Detials (Version 2)
    const swarmHash2 = "dagwrgwgvwergwrvwrg";
    const name2 = "Demo2 Token";
    const symbol2 = "DET2";
    const tokenDetails2 = "This is equity type of issuance";

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);
    const newRegFee = 300 * Math.pow(10, 18);

     // Capped STO details
     const cap = 10000 * Math.pow(10, 18);
     const someString = "Hello string";
     const functionSignature = {
         name: 'configure',
         type: 'function',
         inputs: [{
             type: 'uint256',
             name: '_startTime'
         },{
             type: 'uint256',
             name: '_endTime'
         },{
             type: 'uint256',
             name: '_cap'
         },{
             type: 'string',
             name: '_someString'
         }]
     };

     const functionSignatureProxy = {
        name: 'initialize',
        type: 'function',
        inputs: [{
            type:'address',
            name: '_polymathRegistry'
        },{
            type: 'address',
            name: '_stVersionProxy'
        },{
            type: 'uint256',
            name: '_stLaunchFee'
        },{
            type: 'uint256',
            name: '_tickerRegFee'
        },{
            type: 'address',
            name: '_polyToken'
        },{
            type: 'address',
            name: 'owner'
        }
    ]
    };

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
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})

        // // STEP 2: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

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


        // STEP 4: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // STEP 8: Deploy the CappedSTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 1000 * Math.pow(10, 18), 0, 0,{ from: token_owner });

        assert.notEqual(
            I_DummySTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TestSTOFactory contract was not deployed"
        );

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_DummySTOFactory.address, { from: token_owner });

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

         // Step 10: update the registries addresses from the PolymathRegistry contract
         await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
         I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
         let bytesProxy = web3.eth.abi.encodeFunctionCall(functionSignatureProxy, [I_PolymathRegistry.address, I_STVersion.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
         await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
         I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);    

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            SecurityTokenRegistryProxy: ${I_SecurityTokenRegistryProxy.address}\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            DummySTOFactory: ${I_DummySTOFactory.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });


    describe(" Test cases of the registerTicker", async() => {
        
        it("verify the expiry limit", async() => {
            let expiry = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("expiryLimit"));
            assert.equal(expiry.toNumber(), 1296000, "Expiry limit should be equal to 15 days");
        });

        it("Should fail to register ticker if tickerRegFee not approved", async() => {
            let errorThrown = false;
            try {
                let tx = await I_STRProxied.registerTicker(account_temp, symbol, name, swarmHash, { from: account_temp });
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
                let tx = await I_STRProxied.registerTicker("0x0000000000000000000000000000000000000000", symbol, name, swarmHash, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> owner should not be 0x`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_STRProxied.registerTicker(account_temp, symbol, name, swarmHash, { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp, `Owner should be the ${account_temp}`);
            assert.equal(tx.logs[0].args._symbol, symbol, `Symbol should be ${symbol}`);
        });

        it("Should fail to register ticker due to the symbol length is 0", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
                let tx = await I_STRProxied.registerTicker(account_temp, "", name, swarmHash, { from: account_temp });
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
                let tx = await I_STRProxied.registerTicker(account_temp, "POLYMATHNET", name, swarmHash, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> Symbol Length is greater than 10`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to register same symbol again", async() => {
            // Give POLY to token issuer
            await I_PolyToken.getTokens(initRegFee, token_owner);

            // Call registration function
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, swarmHash, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Symbol is already alloted to someone else`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register pre registerd ticker if expiry is reached", async() => {
            await increaseTime(1300000);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, swarmHash, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._symbol, symbol, `Symbol should be ${symbol}`);
        });

        it("Should fail to register ticker if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.pause({ from: account_polymath});
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let tx = await I_STRProxied.registerTicker(token_owner, "AAA", name, swarmHash, { from: token_owner });
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
            let tx = await I_STRProxied.registerTicker(token_owner, "AAA", name, swarmHash, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Owner should be the ${token_owner}`);
            assert.equal(tx.logs[0].args._symbol, "AAA", `Symbol should be AAA`);
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
            assert.equal(tx[2], name, `Name of the token should equal to ${name}`);
            assert.equal(
                web3.utils.toAscii(tx[3])
                .replace(/\u0000/g, ''),
                swarmHash
            );
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });

        it("Should get the details of unregistered token", async() => {
            let tx = await I_STRProxied.getTickerDetails.call("TORO");
            assert.equal(tx[0], "0x0000000000000000000000000000000000000000", "Should be 0x as ticker is not exists in the registry");
            assert.equal(tx[2], "", "Should be an empty string");
            assert.equal(
                web3.utils.toAscii(tx[3])
                .replace(/\u0000/g, ''),
                ""
            );
            assert.equal(tx[4], false, "Status if the symbol should be undeployed -- false");
        });
    });

    describe("Generate SecurityToken", async() => {

        it("Should get the ticker details successfully and prove the data is not storing in to the logic contract", async() => {
            let data = await I_STRProxied.getTickerDetails(symbol, {from: token_owner});
            assert.equal(data[0], token_owner, "Token owner should be equal");
            assert.equal(data[2], name, "Name of the token should match with the registered symbol infor");
            assert.equal(data[4], false, "Token is not launched yet so it should return False");
            data = await I_SecurityTokenRegistry.getTickerDetails(symbol, {from:token_owner});
            console.log("This is the data from the original securityTokenRegistry contract");
            assert.equal(data[0], '0x0000000000000000000000000000000000000000', "Token owner should be 0x");
        })

        it("Should fail to generate new security token if fee not provided", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_STRProxied.address, 0, { from: token_owner});
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });
            } catch(error) {
                console.log(`         tx revert -> POLY allowance not provided for registration fee`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to generate token if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.pause({ from: account_polymath});
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            await I_STRProxied.unpause({ from: account_polymath});
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTrasnferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey, `Should be equal to the ${transferManagerKey}`);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

    });

    describe("Generate SecurityToken v2", async() => {

        it("Should deploy the st version 2", async() => {
            // Step 7: Deploy the STversionProxy contract

            I_STVersion002 = await STVersion002.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

            assert.notEqual(
                I_STVersion002.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "STVersion002 contract was not deployed",
            );
            await I_STRProxied.setProtocolVersion(I_STVersion002.address, "0.2.0", { from: account_polymath });

            assert.equal(
                web3.utils.toAscii(await I_STRProxied.getBytes32Values.call(web3.utils.soliditySha3("protocolVersion")))
                .replace(/\u0000/g, ''),
                "0.2.0"
            );
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol2, name2, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner, `Token owner should be ${token_owner}`);
            assert.equal(tx.logs[0].args._symbol, symbol2, `Symbol should be ${symbol2}`);
        });

        it("Should generate the new security token with version 2", async() => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name2, symbol2, tokenDetails, false, { from: token_owner, gas:60000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol2, "SecurityToken doesn't get deployed");

            I_SecurityToken002 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken002.LogModuleAdded({from: _blockNo}), 1);
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
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

        it("Should fail to upgrade the logic contract of the STRProxy", async() => {
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
            assert.equal(data[2], name, "Should be equal to the name of the token that is provided earlier");
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
                await I_STRProxied.addCustomSecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_delegate});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not polymath account`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.pause({ from: account_polymath});
                await I_STRProxied.addCustomSecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully generate token if registration is unpaused", async() => {
            await I_STRProxied.unpause({ from: account_polymath});
            let tx = await I_STRProxied.addCustomSecurityToken("LOGAN2", "LOG2", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            assert.equal(tx.logs[1].args._symbol, "LOG2", "Symbol should match with the registered symbol");
            assert.equal(tx.logs[1].args._securityToken, dummy_token,`Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`);
            let symbolDetails = await I_STRProxied.getTickerDetails("LOG2");
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[2], "LOGAN2", `Name of the symbol should be LOGAN2`);
        });

        it("Should fail if ST address is 0 address", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.addCustomSecurityToken("LOGAN", "LOG", account_temp, 0, "I am custom ST", "Swarm hash", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Security token address is 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail if symbol or name of length 0", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.addCustomSecurityToken("", "", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Symbol and name of zero length`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail if symbol is reserved", async() => {
            let errorThrown = false;
            try {
                await I_STRProxied.addCustomSecurityToken(name2, symbol2, account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Symbol is already reserved`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully generate the custom token", async() => {
            let tx = await I_STRProxied.addCustomSecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            assert.equal(tx.logs[1].args._symbol, "LOG", "Symbol should match with the registered symbol");
            assert.equal(tx.logs[1].args._securityToken, dummy_token, `Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`);
            let symbolDetails = await I_STRProxied.getTickerDetails("LOG");
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[2], "LOGAN", `Name of the symbol should be LOGAN`);
        });

    });

    describe("Generate SecurityToken v3", async() => {

        it("Should add the new custom token in the polymath network", async() => {
            await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_temp);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_temp});
            await I_STRProxied.registerTicker(account_temp, "CUST", "custom", "I am swram hash", {from: account_temp});
            let tx = await I_STRProxied.addCustomSecurityToken("custom", "CUST", account_temp, accounts[2], "I am custom ST", "I am swram hash", {from: account_polymath});
            assert.equal(tx.logs[0].args._symbol, "CUST", "Symbol should match with the registered symbol");
            assert.equal(tx.logs[0].args._securityToken, accounts[2], `Address of the SecurityToken should be matched with the input value of addCustomSecurityToken`);
            let symbolDetails = await I_STRProxied.getTickerDetails("CUST");
            assert.equal(symbolDetails[0], account_temp, `Owner of the symbol should be ${account_temp}`);
            assert.equal(symbolDetails[2], "custom", `Name of the symbol should be custom`);
        });

        it("Should deploy the st vesrion 3", async() => {
            // Step 7: Deploy the STversionProxy contract

            I_STVersion003 = await STVersion002.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

            assert.notEqual(
                I_STVersion003.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "STVersion002 contract was not deployed",
            );
            await I_STRProxied.setProtocolVersion(I_STVersion003.address, "0.3.0", { from: account_polymath });

            assert.equal(
                web3.utils.toAscii(await I_STRProxied.getBytes32Values.call(web3.utils.soliditySha3("protocolVersion")))
                .replace(/\u0000/g, ''),
                "0.3.0"
            );
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, "DET3", name2, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, "DET3");
        });

        it("Should generate the new security token with version 3", async() => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name2, "DET3", tokenDetails, false, { from: token_owner, gas:60000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, "DET3", "SecurityToken doesn't get deployed");

            I_SecurityToken002 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken002.LogModuleAdded({from: _blockNo}), 1);


            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

    });

    describe("Attach modules automatically", async() => {

        it("Should intialize the auto attached modules", async () => {
            let moduleData = await I_SecurityToken.modules(transferManagerKey, 0);
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

            assert.notEqual(
             I_GeneralTransferManager.address.valueOf(),
             "0x0000000000000000000000000000000000000000",
             "GeneralTransferManager contract was not deployed",
            );

         });
    });

    describe("Test cases for getters", async() => {

        it("Should get the security token address", async() => {
           let address = await I_STRProxied.getSecurityTokenAddress.call("DET");
           assert.equal(address, I_SecurityToken.address);
        });

        it("Should get the security token data", async() => {
            let data = await I_STRProxied.getSecurityTokenData.call(I_SecurityToken.address);
            assert.equal(data[0], "DET");
            assert.equal(data[1], token_owner);
        });

    });

    describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for changeSecurityLaunchFee", async() => {

            it("Should successfully get the registration fee", async() => {
                let fee = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("stLaunchFee"));
                assert.equal(fee, initRegFee)
            });

            it("Should fail to change the registration fee if msg.sender not owner", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_STRProxied.changeSecurityLaunchFee(400 * Math.pow(10, 18), { from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> Failed to change registrationFee`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the registration fee", async() => {
                await I_STRProxied.changeSecurityLaunchFee(400 * Math.pow(10, 18), { from: account_polymath });
                let fee = await I_STRProxied.getUintValues.call(web3.utils.soliditySha3("stLaunchFee"));
                assert.equal(fee, 400 * Math.pow(10, 18));
            });

        });

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
