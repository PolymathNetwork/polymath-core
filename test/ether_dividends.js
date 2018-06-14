import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { error } from 'util';

const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const EtherDividendCheckpointFactory = artifacts.require('./EtherDividendCheckpointFactory.sol');
const EtherDividendCheckpoint = artifacts.require('./EtherDividendCheckpoint');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('EtherDividendCheckpoint', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
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
    let I_EtherDividendCheckpointFactory;
    let I_GeneralPermissionManager;
    let I_EtherDividendCheckpoint;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_STVersion;
    let I_SecurityToken;
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
    const checkpointKey = 4;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

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

        // STEP 4: Deploy the EtherDividendCheckpoint
        I_EtherDividendCheckpointFactory = await EtherDividendCheckpointFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_EtherDividendCheckpointFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "EtherDividendCheckpointFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the EtherDividendCheckpointFactory
        await I_ModuleRegistry.registerModule(I_EtherDividendCheckpointFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_EtherDividendCheckpointFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolyToken.address, initRegFee, { from: account_polymath });

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
            initRegFee,
            {
                from: account_polymath
            });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistry
        await I_TickerRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});
        await I_ModuleRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            EtherDividendCheckpointFactory: ${I_EtherDividendCheckpointFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
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
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 85000000 });

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

        it("Should successfully attach the EtherDividendCheckpoint with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_EtherDividendCheckpointFactory.address, "", 0, 0, true, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), checkpointKey, "EtherDividendCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "EtherDividendCheckpoint",
                "EtherDividendCheckpoint module was not added"
            );
            I_EtherDividendCheckpoint = EtherDividendCheckpoint.at(tx.logs[2].args._module);
        });
    });

    describe("Check Dividend payouts", async() => {

        it("Buy some tokens for account_investor1 (1 ETH)", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
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

        it("Buy some tokens for account_investor2 (2 ETH)", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Create new dividend", async() => {
            let maturity = latestTime();
            let expiry = latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, {from: token_owner, value: web3.utils.toWei('1.5', 'ether')});
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 1, "Dividend should be created at checkpoint 1");
        });

        it("Investor 1 transfers his token balance to investor 2", async() => {
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), {from: account_investor1});
            assert.equal(await I_SecurityToken.balanceOf(account_investor1), 0);
            assert.equal(await I_SecurityToken.balanceOf(account_investor2), web3.utils.toWei('3', 'ether'));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async() => {
            let investor1Balance = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2Balance = BigNumber(await web3.eth.getBalance(account_investor2));
            await I_EtherDividendCheckpoint.pushDividendPayment(0, 0, 10, {from: token_owner});
            let investor1BalanceAfter = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter = BigNumber(await web3.eth.getBalance(account_investor2));
            assert.equal(investor1BalanceAfter.sub(investor1Balance).toNumber(), web3.utils.toWei('0.5', 'ether'));
            assert.equal(investor2BalanceAfter.sub(investor2Balance).toNumber(), web3.utils.toWei('1', 'ether'));
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(0))[5].toNumber(), web3.utils.toWei('1.5', 'ether'));
        });

        it("Buy some tokens for account_investor3 (7 ETH)", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor3.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei('7', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toNumber(),
                web3.utils.toWei('7', 'ether')
            );
        });

        it("Create another new dividend", async() => {
            let maturity = latestTime();
            let expiry = latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, {from: token_owner, value: web3.utils.toWei('10', 'ether')});
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 2, "Dividend should be created at checkpoint 2");
        });

        it("Investor 3 claims dividend, issuer pushes remainder", async() => {
            let investor1Balance = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2Balance = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3Balance = BigNumber(await web3.eth.getBalance(account_investor3));
            await I_EtherDividendCheckpoint.pullDividendPayment(1, {from: account_investor3, gasPrice: 0});
            let investor1BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toNumber(), 0);
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toNumber(), web3.utils.toWei('7', 'ether'));

            await I_EtherDividendCheckpoint.pushDividendPayment(1, 0, 10, {from: token_owner});
            let investor1BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toNumber(), 0);
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toNumber(), web3.utils.toWei('3', 'ether'));
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toNumber(), 0);
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(1))[5].toNumber(), web3.utils.toWei('10', 'ether'));
        });

        it("Investor 2 transfers 1 ETH of his token balance to investor 1", async() => {
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), {from: account_investor2});
            assert.equal(await I_SecurityToken.balanceOf(account_investor1), web3.utils.toWei('1', 'ether'));
            assert.equal(await I_SecurityToken.balanceOf(account_investor2), web3.utils.toWei('2', 'ether'));
            assert.equal(await I_SecurityToken.balanceOf(account_investor3), web3.utils.toWei('7', 'ether'));
        });

        it("Create another new dividend with explicit", async() => {
            let maturity = latestTime();
            let expiry = latestTime() + duration.days(10);
            let tx = await I_SecurityToken.createCheckpoint({from: token_owner});
            tx = await I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, 3, {from: token_owner, value: web3.utils.toWei('20', 'ether')});
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 3, "Dividend should be created at checkpoint 3");
        });

        it("Investor 2 claims dividend, issuer pushes investor 1", async() => {
            let investor1Balance = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2Balance = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3Balance = BigNumber(await web3.eth.getBalance(account_investor3));
            await I_EtherDividendCheckpoint.pullDividendPayment(2, {from: account_investor2, gasPrice: 0});
            let investor1BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = BigNumber(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toNumber(), web3.utils.toWei('4', 'ether'));
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toNumber(), 0);

            await I_EtherDividendCheckpoint.pushDividendPaymentToAddresses(2, [account_investor1], {from: token_owner});
            let investor1BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter2 = BigNumber(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toNumber(), web3.utils.toWei('2', 'ether'));
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toNumber(), 0);
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toNumber(), 0);
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(2))[5].toNumber(), web3.utils.toWei('6', 'ether'));
        });

        it("Issuer unable to reclaim dividend (expiry not passed)", async() => {
            let errorThrown = false;
            try {
                await I_EtherDividendCheckpoint.reclaimDividend(2, {from: token_owner});
            } catch(error) {
                console.log(`Tx Failed because expiry is in the future ${0}. Test Passed Successfully`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Issuer is able to reclaim dividend after expiry", async() => {
            await increaseTime(11 * 24 * 60 * 60);
            let tokenOwnerBalance = BigNumber(await web3.eth.getBalance(token_owner));
            await I_EtherDividendCheckpoint.reclaimDividend(2, {from: token_owner, gasPrice: 0});
            let tokenOwnerAfter = BigNumber(await web3.eth.getBalance(token_owner));
            assert.equal(tokenOwnerAfter.sub(tokenOwnerBalance).toNumber(), web3.utils.toWei('14', 'ether'));
        });

        it("Investor 3 unable to pull dividend after expiry", async() => {

            let errorThrown = false;
            try {
                await I_EtherDividendCheckpoint.pullDividendPayment(2, {from: account_investor3, gasPrice: 0});
            } catch(error) {
                console.log(`Tx Failed because expiry is in the past ${0}. Test Passed Successfully`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        describe("Test cases for the factory", async() => {
            it("should get the details of the factory", async() => {
                assert.equal(await I_EtherDividendCheckpointFactory.setupCost.call(),0);
                assert.equal(await I_EtherDividendCheckpointFactory.getType.call(),4);
                assert.equal(web3.utils.toAscii(await I_EtherDividendCheckpointFactory.getName.call())
                            .replace(/\u0000/g, ''),
                            "EtherDividendCheckpoint",
                            "Wrong Module added");
            });
        });

    });

});
