import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('GeneralTransferManager', accounts => {

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
    let account_affiliates1;
    let account_affiliates2;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

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
    let I_PolymathRegistry;

    // SecurityToken Details
    const swarmHash = "dagwrgwgvwergwrvwrg";
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
    const initRegFee = 250 * Math.pow(10, 18);

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";
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
        }
        ]
    };

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_delegate = accounts[7];
        account_investor4 = accounts[6];

        account_affiliates1 = accounts[3];
        account_affiliates2 = accounts[4];

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

        // STEP 4: Deploy the DummySTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_DummySTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "DummySTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_DummySTOFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_DummySTOFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, initRegFee, { from: account_polymath });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

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

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner });
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, contact, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 85000000 });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

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
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

        });

        it("Should whitelist the affiliates before the STO attached", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelistMulti(
                        [account_affiliates1, account_affiliates2],
                        [(latestTime() + duration.days(30)),(latestTime() + duration.days(30))],
                        [(latestTime() + duration.days(90)),(latestTime() + duration.days(90))],
                        [(latestTime() + duration.years(1)),(latestTime() + duration.years(1))],
                        [false, false],
                        {
                            from: account_issuer,
                            gas: 6000000
                        });
            assert.equal(tx.logs[0].args._investor, account_affiliates1);
            assert.equal(tx.logs[1].args._investor, account_affiliates2);
        });

        it("Should mint the tokens to the affiliates", async () => {
            await I_SecurityToken.mintMulti([account_affiliates1, account_affiliates2], [(100 * Math.pow(10, 18)), (100 * Math.pow(10, 18))], { from: account_issuer, gas:6000000 });
            assert.equal((await I_SecurityToken.balanceOf.call(account_affiliates1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            assert.equal((await I_SecurityToken.balanceOf.call(account_affiliates2)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [latestTime() + duration.seconds(1000), latestTime() + duration.days(40), cap, someString]);
            const tx = await I_SecurityToken.addModule(I_DummySTOFactory.address, bytesSTO, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "DummySTO",
                "DummySTOFactory module was not added"
            );
            I_DummySTO = DummySTO.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, 0, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), delegateManagerKey, "GeneralPermissionManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "GeneralPermissionManager",
                "GeneralPermissionManager module was not added"
            );
            I_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[2].args._module);
        });

    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            let errorThrown = false;
            try {
                await I_DummySTO.generateTokens(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Investor isn't present in the whitelist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_DummySTO.generateTokens(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should fail in buying the token from the STO", async() => {
            let errorThrown = false;
            try {
                await I_DummySTO.generateTokens(account_affiliates1, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Investor is restricted investor`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in investing the money in STO -- expiry limit reached", async() => {
            let errorThrown = false;
            await increaseTime(duration.days(10));

            try {
                await I_DummySTO.generateTokens(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Investor isn't present in the whitelist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

    });

    describe("Buy tokens using off-chain whitelist", async() => {

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            let errorThrown = false;
            try {
                await I_DummySTO.generateTokens(account_investor2, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Investor isn't present in the whitelist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should buy the tokens -- Failed due to incorrect signature input", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime();
            let validTo = latestTime() + duration.days(5);
            const sig = signData(account_investor2, account_investor2, fromTime, toTime, expiryTime, true, validFrom, validTo, token_owner_pk);

            const r = `0x${sig.r.toString('hex')}`;
            const s = `0x${sig.s.toString('hex')}`;
            const v = sig.v;
            let errorThrown = false;

            try {
              let tx = await I_GeneralTransferManager.modifyWhitelistSigned(
                  account_investor2,
                  fromTime,
                  toTime,
                  expiryTime,
                  true,
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 6000000
                  });
            } catch(error) {
                console.log(`         tx revert -> Incorrect sig data`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        it("Should buy the tokens -- Failed due to incorrect signature timing", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime() - 100;
            let validTo = latestTime()  - 1;
            const sig = signData(I_GeneralTransferManager.address, account_investor2, fromTime, toTime, expiryTime, true, validFrom, validTo, token_owner_pk);

            const r = `0x${sig.r.toString('hex')}`;
            const s = `0x${sig.s.toString('hex')}`;
            const v = sig.v;

            let errorThrown = false;
            try {
              let tx = await I_GeneralTransferManager.modifyWhitelistSigned(
                  account_investor2,
                  fromTime,
                  toTime,
                  expiryTime,
                  true,
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 6000000
                  });
            } catch(error) {
                console.log(`         tx revert -> Incorrect sig data`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        it("Should buy the tokens -- Failed due to incorrect signature signer", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime();
            let validTo = latestTime() + (60 * 60);

            const sig = signData(account_investor2, account_investor2, fromTime, toTime, expiryTime, true, validFrom, validTo, '2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200');

            const r = `0x${sig.r.toString('hex')}`;
            const s = `0x${sig.s.toString('hex')}`;
            const v = sig.v;
            let errorThrown = false;

            try {
              let tx = await I_GeneralTransferManager.modifyWhitelistSigned(
                  account_investor2,
                  fromTime,
                  toTime,
                  expiryTime,
                  true,
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 6000000
                  });
            } catch(error) {
                console.log(`         tx revert -> Incorrect sig data`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime();
            let validTo = latestTime() + duration.days(5);
            const sig = signData(I_GeneralTransferManager.address, account_investor2, latestTime(), latestTime() + duration.days(80), expiryTime + duration.days(200), true, validFrom, validTo, token_owner_pk);

            const r = `0x${sig.r.toString('hex')}`;
            const s = `0x${sig.s.toString('hex')}`;
            const v = sig.v;
            let tx = await I_GeneralTransferManager.modifyWhitelistSigned(
                account_investor2,
                latestTime(),
                latestTime() + duration.days(80),
                expiryTime + duration.days(200),
                true,
                validFrom,
                validTo,
                v,
                r,
                s,
                {
                    from: account_investor2,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(10000);
            // Mint some tokens

            await I_DummySTO.generateTokens(account_investor2, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );

        });

        it("Should fail in changing the signing address", async() => {
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.changeSigningAddress(account_polymath, {from: account_investor4});
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not token_owner`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should get the permission", async() => {
            let perm = await I_GeneralTransferManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ''), "WHITELIST");
            assert.equal(web3.utils.toAscii(perm[1]).replace(/\u0000/g, ''), "FLAGS");
        });

        it("Should provide the permission and change the signing address", async() => {
            let log = await I_GeneralPermissionManager.addPermission(account_delegate, "My details", {from: token_owner});
            assert.equal(log.logs[0].args._delegate, account_delegate);

            await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "FLAGS", true, {from: token_owner});

            assert.isTrue(await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, "FLAGS"));

            let tx = await I_GeneralTransferManager.changeSigningAddress(account_polymath, {from: account_delegate});
            assert.equal(tx.logs[0].args._signingAddress, account_polymath);
        });

        it("Should fail to pull fees as no budget set", async() => {

            let errorThrown = false;
            try {
                await I_GeneralTransferManager.takeFee(web3.utils.toWei('1','ether'), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> No budget set`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should set a budget for the GeneralTransferManager", async() => {
            await I_SecurityToken.changeModuleBudget(2, 0, 10 * Math.pow(10, 18), {from: token_owner});
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.takeFee(web3.utils.toWei('1','ether'), {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> No balance on token`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
            await I_PolyToken.getTokens(10 * Math.pow(10, 18), token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, 10 * Math.pow(10, 18), {from: token_owner});
        });


        it("Factory owner should pull fees - fails as not permissioned by issuer", async() => {
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.takeFee(web3.utils.toWei('1','ether'), {from: account_delegate});
            } catch(error) {
                console.log(`         tx revert -> Incorrect permissions`.grey);
                errorThrown = true;
                ensureException(error);
            }
        });

        it("Factory owner should pull fees", async() => {
            await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "FEE_ADMIN", true, {from: token_owner});
            let balanceBefore = await I_PolyToken.balanceOf(account_polymath);
            await I_GeneralTransferManager.takeFee(web3.utils.toWei('1','ether'), {from: account_delegate});
            let balanceAfter = await I_PolyToken.balanceOf(account_polymath);
            assert.equal(balanceBefore.add(web3.utils.toWei('1','ether')).toNumber(), balanceAfter.toNumber(), "Fee is transferred");
        });

        it("Should change the white list transfer variable", async() => {
            let tx = await I_GeneralTransferManager.changeAllowAllWhitelistIssuances(true, {from : token_owner});
            assert.isTrue(tx.logs[0].args._allowAllWhitelistIssuances);
        });

        it("should failed in trasfering the tokens", async() => {
            let tx = await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, {from : token_owner});
            await I_GeneralTransferManager.pause({from: token_owner});
            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2','ether'), {from: account_investor2});
            } catch(error) {
                console.log(`         tx revert -> Transfer is paused`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the Issuance address", async() => {
            let tx = await I_GeneralTransferManager.changeIssuanceAddress(account_investor2, {from: account_delegate});
            assert.equal(tx.logs[0].args._issuanceAddress, account_investor2);
        });

        it("Should unpause the transfers", async() => {
            await I_GeneralTransferManager.unpause({from: token_owner});

            assert.isFalse(await I_GeneralTransferManager.paused.call());
        });

        it("Should get the init function", async() => {
            let byte = await I_GeneralTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ''), 0);
        });

    });

    describe("WhiteList that addresses", async () => {

        it("Should fail in adding the investors in whitelist", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [expiryTime, expiryTime],
                    [true, true],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                );
            } catch(error) {
                console.log(`         tx revert -> msg.sender is not allowed to modify the whitelist`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor3, account_investor4],
                    [fromTime],
                    [toTime, toTime],
                    [expiryTime, expiryTime],
                    [true, true],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                );
            } catch(error) {
                console.log(`         tx revert -> Array length mismatch`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime],
                    [expiryTime, expiryTime],
                    [true, true],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                );
            } catch(error) {
                console.log(`         tx revert -> Array length mismatch`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail in adding the investors in whitelist -- array length mismatch", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);
            let errorThrown = false;
            try {
                await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor3, account_investor4],
                    [fromTime, fromTime],
                    [toTime, toTime],
                    [expiryTime],
                    [true, true],
                    {
                        from: account_delegate,
                        gas: 6000000
                    }
                );
            } catch(error) {
                console.log(`         tx revert -> Array length mismatch`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully add the investors in whitelist", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(20);
            let expiryTime = toTime + duration.days(10);
            let errorThrown = false;
            let tx = await I_GeneralTransferManager.modifyWhitelistMulti(
                [account_investor3, account_investor4],
                [fromTime, fromTime],
                [toTime, toTime],
                [expiryTime, expiryTime],
                [true, true],
                {
                    from: token_owner,
                    gas: 6000000
                }
            );
            assert.equal(tx.logs[1].args._investor, account_investor4);
        });
    });

    describe("General Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_GeneralTransferManagerFactory.setupCost.call(),0);
            assert.equal(await I_GeneralTransferManagerFactory.getType.call(),2);
            assert.equal(web3.utils.toAscii(await I_GeneralTransferManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "GeneralTransferManager",
                        "Wrong Module added");
            assert.equal(await I_GeneralTransferManagerFactory.getDescription.call(),
                        "Manage transfers using a time based whitelist",
                        "Wrong Module added");
            assert.equal(await I_GeneralTransferManagerFactory.getTitle.call(),
                        "General Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_GeneralTransferManagerFactory.getInstructions.call(),
                        "Allows an issuer to maintain a time based whitelist of authorised token holders.Addresses are added via modifyWhitelist, and take a fromTime (the time from which they can send tokens) and a toTime (the time from which they can receive tokens). There are additional flags, allowAllWhitelistIssuances, allowAllWhitelistTransfers & allowAllTransfers which allow you to set corresponding contract level behaviour. Init function takes no parameters.",
                        "Wrong Module added");

        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_GeneralTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "General");
        });
    });

    describe("Dummy STO Factory test cases", async() => {
        it("should get the exact details of the factory", async() => {
            assert.equal(await I_DummySTOFactory.setupCost.call(),0);
            assert.equal(await I_DummySTOFactory.getType.call(),3);
            assert.equal(web3.utils.toAscii(await I_DummySTOFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "DummySTO",
                        "Wrong Module added");
            assert.equal(await I_DummySTOFactory.getDescription.call(),
                        "Dummy STO",
                        "Wrong Module added");
            assert.equal(await I_DummySTOFactory.getTitle.call(),
                        "Dummy STO",
                        "Wrong Module added");
            assert.equal(await I_DummySTOFactory.getInstructions.call(),
                        "Dummy STO - you can mint tokens at will",
                        "Wrong Module added");

        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_DummySTOFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "Dummy");
        });
    });

    describe("Test cases for the get functions of the dummy sto", async() => {

        it("Should get the raised amount of ether", async() => {
           assert.equal(await I_DummySTO.getRaisedEther.call(), web3.utils.toWei('0','ether'));
        });

        it("Should get the raised amount of poly", async() => {
           assert.equal((await I_DummySTO.getRaisedPOLY.call()).toNumber(), web3.utils.toWei('0','ether'));
        });

        it("Should get the investors", async() => {
           assert.equal((await I_DummySTO.getNumberInvestors.call()).toNumber(), 2);
        });

        it("Should get the listed permissions", async() => {
           let tx = await I_DummySTO.getPermissions.call();
           assert.equal(web3.utils.toAscii(tx[0]).replace(/\u0000/g, ''), "ADMIN");
        });
    });

});
