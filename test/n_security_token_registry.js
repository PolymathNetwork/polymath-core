import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
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
    let I_DummySTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_DummySTO;
    let I_PolyToken;
    let I_STVersion002;
    let I_SecurityToken002;
    let I_STVersion003;
    let I_PolymathRegistry;

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

     // Capped STO details
     const cap = new BigNumber(10000).times(new BigNumber(10).pow(18));
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

        // STEP 2: Deploy the ModuleRegistry

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

        // Step 5: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, initRegFee, { from: account_polymath });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

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
            "DummySTOFactory contract was not deployed"
        );

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_DummySTOFactory.address, { from: token_owner });

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolymathRegistry.address,
            I_STVersion.address,
            initRegFee,
            {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

         // Step 10: update the registries addresses from the PolymathRegistry contract
         await I_SecurityTokenRegistry.updateFromRegistry({from: account_polymath});
         await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
         await I_TickerRegistry.updateFromRegistry({from: account_polymath});



        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            DummySTOFactory: ${I_DummySTOFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });

    describe("Generate SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should fail to generate new security token if fee not provided", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });
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
                await I_SecurityTokenRegistry.pause({ from: account_polymath});
                await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
                await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });
            } catch(error) {
                console.log(`         tx revert -> Registration is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_SecurityTokenRegistry.unpause({ from: account_polymath});
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas:60000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTrasnferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
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
            await I_SecurityTokenRegistry.setProtocolVersion(I_STVersion002.address, "0.2.0", { from: account_polymath });

            assert.equal(
                web3.utils.toAscii(await I_SecurityTokenRegistry.protocolVersion.call())
                .replace(/\u0000/g, ''),
                "0.2.0"
            );
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol2, name2, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol2);
        });

        it("Should generate the new security token with version 2", async() => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name2, symbol2, tokenDetails, false, { from: token_owner, gas:60000000  });

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

    describe("Generate custom tokens", async() => {

        it("Should fail if msg.sender is not polymath", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistry.addCustomSecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_delegate});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not polymath account`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully generate token", async() => {
            let tx = await I_SecurityTokenRegistry.addCustomSecurityToken("LOGAN2", "LOG2", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            assert.equal(tx.logs[0].args._symbol, "LOG2");
            assert.equal(tx.logs[0].args._securityToken, dummy_token);
            let symbolDetails = await I_TickerRegistry.getDetails("LOG2");
            assert.equal(symbolDetails[0], account_temp);
            assert.equal(symbolDetails[2], "LOGAN2");
        });

        it("Should fail if ST address is 0 address", async() => {
            let errorThrown = false;
            try {
                await I_SecurityTokenRegistry.addCustomSecurityToken("LOGAN", "LOG", account_temp, 0, "I am custom ST", "Swarm hash", {from: account_polymath});
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
                await I_SecurityTokenRegistry.addCustomSecurityToken("", "", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
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
                await I_SecurityTokenRegistry.addCustomSecurityToken(name2, symbol2, account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Symbol is already reserved`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully generate the custom token", async() => {
            let tx = await I_SecurityTokenRegistry.addCustomSecurityToken("LOGAN", "LOG", account_temp, dummy_token, "I am custom ST", "Swarm hash", {from: account_polymath});
            assert.equal(tx.logs[0].args._symbol, "LOG");
            assert.equal(tx.logs[0].args._securityToken, dummy_token);
            let symbolDetails = await I_TickerRegistry.getDetails("LOG");
            assert.equal(symbolDetails[0], account_temp);
            assert.equal(symbolDetails[2], "LOGAN");
        });

    });

    describe("Generate SecurityToken v3", async() => {

        it("Should add the new custom token in the polymath network", async() => {
            await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_temp);
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: account_temp});
            await I_TickerRegistry.registerTicker(account_temp, "CUST", "custom", "I am swram hash", {from: account_temp});
            let tx = await I_SecurityTokenRegistry.addCustomSecurityToken("custom", "CUST", account_temp, accounts[2], "I am custom ST", "I am swram hash", {from: account_polymath});
            assert.equal(tx.logs[0].args._symbol, "CUST");
            assert.equal(tx.logs[0].args._securityToken, accounts[2]);
            let symbolDetails = await I_TickerRegistry.getDetails("CUST");
            assert.equal(symbolDetails[0], account_temp);
            assert.equal(symbolDetails[2], "custom");
        });

        it("Should deploy the st vesrion 3", async() => {
            // Step 7: Deploy the STversionProxy contract

            I_STVersion003 = await STVersion002.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

            assert.notEqual(
                I_STVersion003.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "STVersion002 contract was not deployed",
            );
            await I_SecurityTokenRegistry.setProtocolVersion(I_STVersion003.address, "0.3.0", { from: account_polymath });

            assert.equal(
                web3.utils.toAscii(await I_SecurityTokenRegistry.protocolVersion.call())
                .replace(/\u0000/g, ''),
                "0.3.0"
            );
        });

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, "DET3", name2, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, "DET3");
        });

        it("Should generate the new security token with version 3", async() => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name2, "DET3", tokenDetails, false, { from: token_owner, gas:60000000  });

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

         it("Should failed in attaching the STO factory with the security token -- because securityToken doesn't have sufficient balance", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(
                functionSignature,
                [
                    (latestTime() + duration.seconds(500)),
                    (latestTime() + duration.days(30)),
                    cap,
                    someString,
                ]);

            let errorThrown = false;

            try {
                const tx = await I_SecurityToken.addModule(
                    I_DummySTOFactory.address,
                    bytesSTO,
                    (1000 * Math.pow(10, 18)),
                    (1000 * Math.pow(10, 18)),
                    {
                        from: token_owner,
                        gas: 26000000
                    });
            } catch(error) {
                console.log(`         tx revert -> SecurityToken doesn't have sufficient POLY to pay`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(
                functionSignature,
                [
                    (latestTime() + duration.seconds(1000)),
                    (latestTime() + duration.days(30)),
                    cap,
                    someString,
                ]);
            await I_PolyToken.getTokens((1000 * Math.pow(10, 18)), I_SecurityToken.address);
            const tx = await I_SecurityToken.addModule(
                I_DummySTOFactory.address,
                bytesSTO,
                (1000 * Math.pow(10, 18)),
                (1000 * Math.pow(10, 18)),
                {
                    from: token_owner,
                    gas: 26000000
                });
            assert.equal(tx.logs[3].args._type, stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "DummySTO",
                "DummySTOFactory module was not added"
            );

            I_DummySTO = DummySTO.at(tx.logs[3].args._module);
        });

    });

    describe("Test cases for getters", async() => {

        it("Should get the security token address", async() => {
           let address = await I_SecurityTokenRegistry.getSecurityTokenAddress.call("DET");
           assert.equal(address, I_SecurityToken.address);
        });

        it("Should get the security token data", async() => {
            let data = await I_SecurityTokenRegistry.getSecurityTokenData.call(I_SecurityToken.address);
            assert.equal(data[0], "DET");
            assert.equal(data[1], token_owner);
        });

    });

    describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for changePolyRegistrationFee", async() => {

            it("Should successfully get the registration fee", async() => {
                let fee = await I_SecurityTokenRegistry.registrationFee.call();
                assert.equal(fee, initRegFee)
            });

            it("Should fail to change the registration fee if msg.sender not owner", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_SecurityTokenRegistry.changePolyRegistrationFee(400 * Math.pow(10, 18), { from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> Failed to change registrationFee`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the registration fee", async() => {
                await I_SecurityTokenRegistry.changePolyRegistrationFee(400 * Math.pow(10, 18), { from: account_polymath });
                let fee = await I_SecurityTokenRegistry.registrationFee.call();
                assert.equal(fee, 400 * Math.pow(10, 18));
            });

        });

        describe("Test cases for reclaiming funds", async() => {

            it("Should successfully reclaim POLY tokens", async() => {
                I_PolyToken.transfer(I_SecurityTokenRegistry.address, web3.utils.toWei("1"), { from: token_owner });
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_SecurityTokenRegistry.reclaimERC20(I_PolyToken.address);
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(bal2.dividedBy(new BigNumber(10).pow(18)).toNumber(), bal2.dividedBy(new BigNumber(10).pow(18)).toNumber());
            });

        });

        describe("Test cases for pausing the contract", async() => {

            it("Should fail to pause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityTokenRegistry.pause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully pause the contract", async() => {
                await I_SecurityTokenRegistry.pause({ from: account_polymath });
                let status = await I_SecurityTokenRegistry.paused.call();
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityTokenRegistry.unpause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully unpause the contract", async() => {
                await I_SecurityTokenRegistry.unpause({ from: account_polymath });
                let status = await I_SecurityTokenRegistry.paused.call();
                assert.isNotOk(status);
            });

        });

    });

});
