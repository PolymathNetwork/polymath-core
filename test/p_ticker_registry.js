import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');


const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('TickerRegistry', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_temp;

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
    let I_STVersion;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = 'FLAGS';
    const TM_Perm_Whitelist = 'WHITELIST';

    // Capped STO details
    let startTime;
    let endTime;
    const cap = new BigNumber(10000).times(new BigNumber(10).pow(18));
    const rate = 1000;

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_temp = accounts[8];
        token_owner = account_issuer;

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

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, initRegFee, { from: account_polymath });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 8: Deploy the SecurityTokenRegistry

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

        // Step 8: Set the STR in TickerRegistry
         // Step 10: update the registries addresses from the PolymathRegistry contract
         await I_SecurityTokenRegistry.updateFromRegistry({from: account_polymath});
         await I_ModuleRegistry.updateFromRegistry({from: account_polymath});
         await I_TickerRegistry.updateFromRegistry({from: account_polymath});

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });

    describe("Test cases for the TickerRegistry public variable", async () => {

        it("verify the securityTokenRegistry address", async() => {
            let str = await I_TickerRegistry.securityTokenRegistry.call();
            assert.equal(str, I_SecurityTokenRegistry.address);
        });

        it("verify the expiry limit", async() => {
            let expiry = await I_TickerRegistry.expiryLimit.call();
            assert.equal(expiry.toNumber(), 1296000);
        });
    });

    describe("Test cases for the registerTicker function", async() => {

        it("Should fail to register ticker if registrationFee not approved", async() => {
            let errorThrown = false;
            try {
                let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from: token_owner });
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
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_TickerRegistry.registerTicker("0x0000000000000000000000000000000000000000", symbol, name, swarmHash, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> owner should not be 0x`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register ticker", async() => {
            
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should fail to register ticker due to the symbol length is 0", async() => {
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_TickerRegistry.registerTicker(token_owner, "", name, swarmHash, { from: token_owner });
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
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_TickerRegistry.registerTicker(token_owner, "POLYMATHNET", name, swarmHash, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Symbol Length is greater than 10`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });


        it("Should fail to register same symbol again", async() => {
            // Give POLY to token issuer
            await I_PolyToken.getTokens(initRegFee, account_temp);

            // Call registration function
            let errorThrown = false;
            try {
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: account_temp});
                let tx = await I_TickerRegistry.registerTicker(account_temp, symbol, name, swarmHash, { from: account_temp });
            } catch(error) {
                console.log(`         tx revert -> Symbol is already alloted to someone else`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register pre registerd ticker if expiry is reached", async() => {
            await increaseTime(1300000);
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: account_temp});
            let tx = await I_TickerRegistry.registerTicker(account_temp, symbol, name, swarmHash, { from: account_temp });
            assert.equal(tx.logs[0].args._owner, account_temp);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should fail to register ticker if registration is paused", async() => {
            let errorThrown = false;
            try {
                await I_TickerRegistry.pause({ from: account_polymath});
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_TickerRegistry.registerTicker(token_owner, "AAA", name, swarmHash, { from: token_owner });
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
                await I_TickerRegistry.pause({ from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> Registration is already paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully register ticker if registration is unpaused", async() => {
            await I_TickerRegistry.unpause({ from: account_polymath});
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, "AAA", name, swarmHash, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, "AAA");
        });

        it("Should fail to unpause if already unpaused", async() => {
            let errorThrown = false;
            try {
                await I_TickerRegistry.unpause({ from: account_polymath});
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
                let tx = await I_TickerRegistry.changeExpiryLimit(duration.days(10), {from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully set the expiry limit", async() => {
            await I_TickerRegistry.changeExpiryLimit(duration.days(10), {from: account_polymath});
            assert.equal(
                (await I_TickerRegistry.expiryLimit.call())
                .toNumber(),
                duration.days(10),
                "Failed to change the expiry limit");
        });

        it("Should fail to set the expiry limit because new expiry limit is lesser than one day", async() => {
            let errorThrown = false;
            try {
                let tx = await I_TickerRegistry.changeExpiryLimit(duration.seconds(5000), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> New expiry limit is lesser than one day`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Test cases for the getDetails", async() => {

        it("Should get the details of the symbol", async() => {
            let tx = await I_TickerRegistry.getDetails.call(symbol);
            assert.equal(tx[0], account_temp);
            assert.equal(tx[2], name);
            assert.equal(
                web3.utils.toAscii(tx[3])
                .replace(/\u0000/g, ''),
                swarmHash
            );
            assert.equal(tx[4], false);
        });

        it("Should get the details of unregistered token", async() => {
            let tx = await I_TickerRegistry.getDetails.call("TORO");
            assert.equal(tx[0], "0x0000000000000000000000000000000000000000");
            assert.equal(tx[2], "");
            assert.equal(
                web3.utils.toAscii(tx[3])
                .replace(/\u0000/g, ''),
                ""
            );
            assert.equal(tx[4], false);
        });

    });

    describe("Test cases for check validity", async() => {

        it("Should fail to check the validity because msg.sender is not STR", async() => {
            let errorThrown = false;
            try {
                await I_TickerRegistry.checkValidity(symbol, account_temp, name, {from: accounts[9]});
            } catch(error) {
                console.log(`         tx revert -> Failed checkValidity because msg.sender is not the STR`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Test cases for isReserved", async() => {

        it("Should fail to check if reserved because msg.sender is not STR", async() => {
            let errorThrown = false;
            try {
                await I_TickerRegistry.isReserved(symbol, account_temp, name, swarmHash, {from: accounts[9]});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not the STR`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

    });

    describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for changePolyRegistrationFee", async() => {

            it("Should successfully get the registration fee", async() => {
                let fee = await I_TickerRegistry.registrationFee.call();
                assert.equal(fee, initRegFee)
            });

            it("Should fail to change the registration fee if msg.sender not owner", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_TickerRegistry.changePolyRegistrationFee(400 * Math.pow(10, 18), { from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> Failed to change registrationFee`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to change the registration fee if fee is equivalent", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_TickerRegistry.changePolyRegistrationFee(initRegFee, { from: account_polymath });
                } catch(error) {
                    console.log(`         tx revert -> Failed to change registrationFee`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the registration fee", async() => {
                await I_TickerRegistry.changePolyRegistrationFee(400 * Math.pow(10, 18), { from: account_polymath });
                let fee = await I_TickerRegistry.registrationFee.call();
                assert.equal(fee, 400 * Math.pow(10, 18));
            });

        });

        describe("Test cases for reclaiming funds", async() => {

            it("Should successfully reclaim POLY tokens", async() => {
                I_PolyToken.transfer(I_TickerRegistry.address, web3.utils.toWei("1"), { from: token_owner });
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_TickerRegistry.reclaimERC20(I_PolyToken.address);
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(bal2.dividedBy(new BigNumber(10).pow(18)).toNumber(), bal2.dividedBy(new BigNumber(10).pow(18)).toNumber());
            });

            it("Should fail to reclaim tokens if address provided is 0 address", async() => {
                let errorThrown = false;
                try {
                    await I_TickerRegistry.reclaimERC20("0x0000000000000000000000000000000000000000");
                } catch(error) {
                    console.log(`         tx revert -> Address provided is address(0)`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to reclaim tokens if token transfer fails", async() => {
                let errorThrown = false;
                try {
                    await I_TickerRegistry.reclaimERC20("0x0000000000000000000000000000000000000001");
                } catch(error) {
                    console.log(`         tx revert -> Address provided is address(0)`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

        });


        describe("Test cases for pausing the contract", async() => {

            it("Should fail to pause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_TickerRegistry.pause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully pause the contract", async() => {
                await I_TickerRegistry.pause({ from: account_polymath });
                let status = await I_TickerRegistry.paused.call();
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_TickerRegistry.unpause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully unpause the contract", async() => {
                await I_TickerRegistry.unpause({ from: account_polymath });
                let status = await I_TickerRegistry.paused.call();
                assert.isNotOk(status);
            });

        });
    });

});
