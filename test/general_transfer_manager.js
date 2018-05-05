import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';

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
const ExchangeTransferManager = artifacts.require('./ExchangeTransferManager');
const PolyTokenFaucet = artifacts.require('./helpers/contracts/PolyTokenFaucet.sol');

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
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_ExchangeTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_DummySTO;
    let I_PolyToken;

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

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
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
    }, [startTime, endTime, cap, someString]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];


        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the Polytoken Contract
        I_PolyToken = await PolyTokenFaucet.new();

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the DummySTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, {from:account_polymath});

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

        I_TickerRegistry = await TickerRegistry.new({ from: account_polymath });

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

        // Step 8: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolyToken.address,
            I_ModuleRegistry.address,
            I_TickerRegistry.address,
            I_STVersion.address,
            {
                from: account_polymath
            });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistry & ModuleRegistry
        await I_TickerRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});
        await I_ModuleRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});


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
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, contact, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, decimals, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
            LogAddModule.stopWatching();
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

        it("Should successfully attach the STO factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_DummySTOFactory.address, bytesSTO, 0, 0, true, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "DummySTO",
                "DummySTOFactory module was not added"
            );
            I_DummySTO = DummySTO.at(tx.logs[2].args._module);
        });
    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            let errorThrown = false;
            try {
                await I_DummySTO.generateTokens(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`Failed because investor isn't present in the whitelist`);
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
                {
                    from: account_issuer,
                    gas: 500000
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

        it("Should fail in investing the money in STO -- expiry limit reached", async() => {
            let errorThrown = false;
            await increaseTime(duration.days(10));

            try {
                await I_DummySTO.generateTokens(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });
            } catch(error) {
                console.log(`Failed because investor isn't present in the whitelist`);
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
                console.log(`Failed because investor isn't present in the whitelist`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should buy the tokens -- Failed due to incorrect signature input", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime();
            let validTo = latestTime() + (60 * 60);
            const sig = signData(account_investor2, account_investor2, fromTime, toTime, expiryTime, validFrom, validTo, token_owner_pk);

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
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 500000
                  });
            } catch(error) {
                console.log(`Failed because incorrect sig data`);
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
            const sig = signData(I_GeneralTransferManager.address, account_investor2, fromTime, toTime, expiryTime, validFrom, validTo, token_owner_pk);

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
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 500000
                  });
            } catch(error) {
                console.log(`Failed because incorrect sig data`);
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

            const sig = signData(account_investor2, account_investor2, fromTime, toTime, expiryTime, validFrom, validTo, '2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200');

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
                  validFrom,
                  validTo,
                  v,
                  r,
                  s,
                  {
                      from: account_investor2,
                      gas: 500000
                  });
            } catch(error) {
                console.log(`Failed because incorrect sig data`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist
            //tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk
            let validFrom = latestTime();
            let validTo = latestTime() + (60 * 60);
            const sig = signData(I_GeneralTransferManager.address, account_investor2, fromTime, toTime, expiryTime + duration.days(100), validFrom, validTo, token_owner_pk);

            const r = `0x${sig.r.toString('hex')}`;
            const s = `0x${sig.s.toString('hex')}`;
            const v = sig.v;
            let tx = await I_GeneralTransferManager.modifyWhitelistSigned(
                account_investor2,
                fromTime,
                toTime,
                expiryTime + duration.days(100),
                validFrom,
                validTo,
                v,
                r,
                s,
                {
                    from: account_investor2,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_DummySTO.generateTokens(account_investor2, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );

        });

    });

});
