import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';

const USDTieredSTOFactory = artifacts.require('./USDTieredSTOFactory.sol');
const USDTieredSTO = artifacts.require('./USDTieredSTO.sol');
const MockOracle = artifacts.require('./MockOracle.sol');
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

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('USDTieredSTO', accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;
    let account_investor6;
    let account_investor7;
    let account_investor8;
    let account_issuer;
    let token_owner;
    let wallet;

    let balanceOfReceiver;
    let message = "Transaction Should Fail!";
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);
    let expiryTime = toTime + duration.days(100);

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_USDTieredSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_STVersion;
    let I_SecurityToken;
    let I_USDTieredSTO;
    let I_PolyToken;

    // SecurityToken Details for funds raise Type ETH
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // SecurityToken Details for funds raise Type POLY
    const P_name = "Team Poly";
    const P_symbol = "PAS";
    const P_tokenDetails = "This is equity type of issuance";
    const P_decimals = 18;

    // Module key
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);

    // USDTieredSTO details
    let startTime;           // Start time will be 5000 seconds more than the latest time
    let endTime;             // Add 30 days more
    /* function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _tokensPerTier,
        address _securityTokenRegistry,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        uint8 _startingTier,
        uint8[] _fundRaiseTypes,
        address _wallet
    ) */
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
            type: 'uint256[]',
            name: '_ratePerTier'
        },{
            type: 'uint256[]',
            name: '_tokensPerTier'
        },{
            type: 'address',
            name: '_securityTokenRegistry'
        },{
            type: 'uint256',
            name: '_nonAccreditedLimitUSD'
        },{
            type: 'uint256',
            name: '_minimumInvestmentUSD'
        },{
            type: 'uint8',
            name: '_startingTier'
        },{
            type: 'uint8[]',
            name: '_fundRaiseTypes'
        },{
            type: 'address',
            name: '_wallet'
        },{
            type: 'address',
            name: '_reserveWallet'
        }
        ]
    };

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        wallet = accounts[2];
        account_investor1 = accounts[3];
        account_investor2 = accounts[4];
        account_investor3 = accounts[5];
        account_investor4 = accounts[6];
        account_investor5 = accounts[7];
        account_investor6 = accounts[8];
        token_owner = account_issuer;

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

        // STEP 4: Deploy the USDTieredSTOFactory

        I_USDTieredSTOFactory = await USDTieredSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: token_owner });

        assert.notEqual(
            I_USDTieredSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "USDTieredSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_USDTieredSTOFactory.address, { from: token_owner });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolyToken.address, initRegFee, { from: account_polymath });

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

        // Step 9: Deploy & Register Mock Oracles
        I_USDOracle = await MockOracle.new(0, "ETH", "USD", BigNumber(500).mul(10**18), { from: account_polymath });
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, "POLY", "USD", BigNumber(25).mul(10**16), { from: account_polymath });//25 cents per POLY
        await I_SecurityTokenRegistry.changeOracle("ETH", "USD", I_USDOracle.address, { from: account_polymath })
        await I_SecurityTokenRegistry.changeOracle("POLY", "USD", I_POLYOracle.address, { from: account_polymath })

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            USDTieredSTOFactory: ${I_USDTieredSTOFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
            USDOracle: ${I_USDOracle.address}\n
            POLYOracle: ${I_POLYOracle.address}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_TickerRegistry.registerTicker(token_owner, symbol, name, swarmHash, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, true, { from: token_owner, gas: 85000000  });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), transferManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
            LogAddModule.stopWatching();
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(transferManagerKey, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

        });

        it("Should successfully attach the STO factory with the security token", async () => {
            startTime = latestTime() + duration.days(1);           // Start time will be 5000 seconds more than the latest time
            endTime = startTime + duration.days(30);
            console.log([startTime, endTime, [BigNumber(10*10**16), BigNumber(15*10**16)], [BigNumber(100000000).mul(BigNumber(10**18)), BigNumber(200000000).mul(BigNumber(10**18))], I_SecurityTokenRegistry.address, BigNumber(10000).mul(BigNumber(10**18)), 0, 0, [0, 1], wallet]);
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, [BigNumber(10*10**16), BigNumber(15*10**16)], [BigNumber(100000000).mul(BigNumber(10**18)), BigNumber(200000000).mul(BigNumber(10**18))], I_SecurityTokenRegistry.address, BigNumber(10000).mul(BigNumber(10**18)), 0, 0, [0, 1], wallet, wallet]);
            const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: token_owner, gas: 4500000 });

            assert.equal(tx.logs[2].args._type, stoKey, "USDTieredSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "USDTieredSTO",
                "USDTieredSTOFactory module was not added"
            );
            I_USDTieredSTO = USDTieredSTO.at(tx.logs[2].args._module);
        });
    });

    describe("Buy tokens", async() => {

        it("Should Buy the tokens using ETH", async() => {
            balanceOfReceiver = await web3.eth.getBalance(wallet);
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(duration.days(1));

            // Check rates
            // console.log((await I_USDTieredSTO.convertToUSD("ETH", web3.utils.toWei('1', 'ether'))));
            // console.log((await I_USDTieredSTO.convertToUSD("POLY", web3.utils.toWei('1', 'ether'))));

            // Fallback transaction
            await web3.eth.sendTransaction({
                from: account_investor1,
                to: I_USDTieredSTO.address,
                gas: 2100000,
                value: web3.utils.toWei('1', 'ether')
            });

            assert.equal(
                (await I_USDTieredSTO.fundsRaisedETH.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1
            );

            assert.equal(await I_USDTieredSTO.getNumberInvestors.call(), 1);

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                5000
            );

            assert.equal(
                BigNumber(await web3.eth.getBalance(wallet))
                .sub(balanceOfReceiver)
                .toNumber(),
                web3.utils.toWei('1', 'ether')
            );

        });

        it("Should Buy the tokens using POLY", async() => {
            balanceOfReceiver = await I_PolyToken.balanceOf(wallet);

            // Mint & approve some tokens for the investor
            await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_investor1);
            await I_PolyToken.approve(I_USDTieredSTO.address, (10000 * 10**18), {from: account_investor1});

            // Check rates
            // console.log((await I_USDTieredSTO.convertToUSD("ETH", web3.utils.toWei('1', 'ether'))));
            // console.log((await I_USDTieredSTO.convertToUSD("POLY", web3.utils.toWei('1', 'ether'))));

            await I_USDTieredSTO.buyWithPoly(account_investor1, 1000 * 10**18, {from: account_investor1});

            assert.equal(
                (await I_USDTieredSTO.fundsRaisedPOLY.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000
            );

            assert.equal(await I_USDTieredSTO.getNumberInvestors.call(), 1);

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                5000+2500
            );


            assert.equal(
                BigNumber(await I_PolyToken.balanceOf(wallet))
                .sub(balanceOfReceiver)
                .toNumber(),
                web3.utils.toWei('1000', 'ether')
            );

        });
/*
        it("Verification of the event Token Purchase", async() => {
            let TokenPurchase = I_USDTieredSTO.allEvents();
            let log = await new Promise(function(resolve, reject) {
                TokenPurchase.watch(function(error, log){ resolve(log);})
            });

            assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
            assert.equal(
                (log.args.amount)
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000,
                "Wrong No. token get dilivered"
            );
            TokenPurchase.stopWatching();
        });

        it("Should pause the STO -- Failed due to wrong msg.sender", async()=> {
            let errorThrown = false;
            try {
                let tx = await I_USDTieredSTO.pause({from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> Wrong msg.sender`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should pause the STO", async()=> {
            let tx = await I_USDTieredSTO.pause({from: account_issuer});
            assert.isTrue(await I_USDTieredSTO.paused.call());
        });

        it("Should fail to buy the tokens after pausing the STO", async() => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_USDTieredSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> STO is paused`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should unpause the STO -- Failed due to wrong msg.sender", async()=> {
            let errorThrown = false;
            try {
                let tx = await I_USDTieredSTO.unpause(Math.floor(Date.now()/1000 + 50000), {from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> Wrong msg.sender`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should unpause the STO -- Failed due to entered date is less than the end date", async()=> {
            let errorThrown = false;
            try {
                let tx = await I_USDTieredSTO.unpause(Math.floor(Date.now()/1000 - 500000), {from: account_issuer});
            } catch(error) {
                console.log(`         tx revert -> Entered date is less than the end date`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should unpause the STO", async()=> {
            await increaseTime(50);
            let newEndDate = ((await I_USDTieredSTO.endTime.call()).toNumber() - latestTime()) + latestTime() + 20;
            let tx = await I_USDTieredSTO.unpause(newEndDate, {from: account_issuer});
            assert.isFalse(await I_USDTieredSTO.paused.call());
        });

        it("Should buy the tokens -- Failed due to wrong granularity", async () => {
            let errorThrown = false;
            try {
                 await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_USDTieredSTO.address,
                    value: web3.utils.toWei('0.1111', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> Wrong purchase granularity`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should restrict to buy tokens after hiting the cap in second tx first tx pass", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                fromTime,
                toTime + duration.days(20),
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

             // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_USDTieredSTO.address,
                gas: 2100000,
                value: web3.utils.toWei('9', 'ether')
              });

              assert.equal(
                (await I_USDTieredSTO.fundsRaised.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                10
            );

            assert.equal(await I_USDTieredSTO.getNumberInvestors.call(), 2);

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                9000
            );
            try {
                // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_USDTieredSTO.address,
                gas: 210000,
                value: web3.utils.toWei('1', 'ether')
              });
            } catch(error) {
                console.log(`         tx revert -> Cap reached`.grey);
                ensureException(error);
            }
        });

        it("Should failed at the time of buying the tokens -- Because STO get expired", async() => {
            await increaseTime(duration.days(17)); // increased beyond the end time of the STO
            let errorThrown = false;
            try {
                // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_USDTieredSTO.address,
                gas: 2100000,
                value: web3.utils.toWei('1', 'ether')
              });
            } catch(error) {
                console.log(`         tx revert -> STO get expired reached`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fundRaised value equal to the raised value in the funds receiver wallet", async() => {
            const newBalance = await web3.eth.getBalance(account_fundsReceiver);
            //console.log("WWWW",newBalance,await I_USDTieredSTO.fundsRaised.call(),balanceOfReceiver);
            let op = (BigNumber(newBalance).minus(balanceOfReceiver)).toNumber();
            assert.equal(
                (await I_USDTieredSTO.fundsRaised.call()).toNumber(),
                op,
                "Somewhere raised money get stolen or sent to wrong wallet"
            );
        });

        it("Should get the raised amount of ether", async() => {
            assert.equal(await I_USDTieredSTO.getRaisedEther.call(), web3.utils.toWei('10','ether'));
        });

        it("Should get the raised amount of poly", async() => {
            assert.equal((await I_USDTieredSTO.getRaisedPOLY.call()).toNumber(), web3.utils.toWei('0','ether'));
         });

    });

    describe("Test Cases for an STO of fundraise type POLY", async() => {

        describe("Launch a new SecurityToken", async() => {

            it("POLY: Should register the ticker before the generation of the security token", async () => {
                await I_PolyToken.approve(I_TickerRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_TickerRegistry.registerTicker(token_owner, P_symbol, P_name, swarmHash, { from : token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._symbol, P_symbol);
            });

            it("POLY: Should generate the new security token with the same symbol as registered above", async () => {
                P_startTime = endTime + duration.days(2);
                P_endTime = P_startTime + duration.days(30);
                await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner});
                let tx = await I_SecurityTokenRegistry.generateSecurityToken(P_name, P_symbol, P_tokenDetails, false, { from: token_owner, gas:85000000 });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, P_symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

                const LogAddModule = await I_SecurityToken.allEvents();
                const log = await new Promise(function(resolve, reject) {
                    LogAddModule.watch(function(error, log){ resolve(log);});
                });

                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._type.toNumber(), transferManagerKey);
                assert.equal(
                    web3.utils.toAscii(log.args._name)
                    .replace(/\u0000/g, ''),
                    "GeneralTransferManager"
                );
                LogAddModule.stopWatching();
            });

            it("POLY: Should intialize the auto attached modules", async () => {
                let moduleData = await I_SecurityToken.modules(transferManagerKey, 0);
                I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

                assert.notEqual(
                 I_GeneralTransferManager.address.valueOf(),
                 "0x0000000000000000000000000000000000000000",
                 "GeneralTransferManager contract was not deployed",
                );

             });

             it("POLY: Should successfully attach the STO factory with the security token", async () => {
                await I_PolyToken.getTokens(USDTieredSTOSetupCost, token_owner);
                await I_PolyToken.transfer(I_SecurityToken.address, USDTieredSTOSetupCost, { from: token_owner});

                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [P_startTime, P_endTime, P_cap, P_rate, P_fundRaiseType, account_fundsReceiver]);

                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner, gas: 26000000 });

                assert.equal(tx.logs[3].args._type, stoKey, "USDTieredSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[3].args._name)
                    .replace(/\u0000/g, ''),
                    "USDTieredSTO",
                    "USDTieredSTOFactory module was not added"
                );
                I_USDTieredSTO = USDTieredSTO.at(tx.logs[3].args._module);
            });

        });

        describe("verify the data of STO", async () => {

            it("Should verify the configuration of the STO", async() => {
                assert.equal(
                    (await I_USDTieredSTO.startTime.call()).toNumber(),
                    P_startTime,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO.endTime.call()).toNumber(),
                    P_endTime,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO.cap.call()).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    P_cap.dividedBy(new BigNumber(10).pow(18)),
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_USDTieredSTO.rate.call(),
                    P_rate,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_USDTieredSTO.fundRaiseType(P_fundRaiseType),
                    true,
                    "STO Configuration doesn't set as expected"
                );
            });
        });

        describe("Buy tokens", async() => {

            it("Should Buy the tokens", async() => {
                // Add the Investor in to the whitelist

                await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_investor1);

                assert.equal(
                    (await I_PolyToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    10000,
                    "Tokens are not transfered properly"
                );

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    P_fromTime,
                    P_toTime,
                    P_expiryTime,
                    true,
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

                // Jump time
                await increaseTime(duration.days(17));

                await I_PolyToken.approve(I_USDTieredSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});

                // buyTokensWithPoly transaction
                await I_USDTieredSTO.buyTokensWithPoly(
                    (1000 * Math.pow(10, 18)),
                    {
                        from : account_investor1,
                        gas: 6000000
                    }
                );

                assert.equal(
                    (await I_USDTieredSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );

                assert.equal(await I_USDTieredSTO.getNumberInvestors.call(), 1);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    5000
                );
            });

            it("Verification of the event Token Purchase", async() => {
                let TokenPurchase = I_USDTieredSTO.allEvents();
                let log = await new Promise(function(resolve, reject) {
                    TokenPurchase.watch(function(error, log){ resolve(log);})
                });

                assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
                assert.equal(
                    (log.args.amount)
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    5000,
                    "Wrong No. token get dilivered"
                );
                TokenPurchase.stopWatching();
            });

            it("Should restrict to buy tokens after hiting the cap in second tx first tx pass", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor2,
                    P_fromTime,
                    P_toTime + duration.days(20),
                    P_expiryTime,
                    true,
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

                await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_investor2);

                await I_PolyToken.approve(I_USDTieredSTO.address, (9000 * Math.pow(10, 18)), { from: account_investor2});

                // buyTokensWithPoly transaction
                await I_USDTieredSTO.buyTokensWithPoly(
                    (9000 * Math.pow(10, 18)),
                    {from : account_investor2, gas: 6000000 }
                );

                  assert.equal(
                    (await I_USDTieredSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    10000
                );

                assert.equal(await I_USDTieredSTO.getNumberInvestors.call(), 2);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    45000
                );
                let errorThrown = false;
                try {

                await I_PolyToken.approve(I_USDTieredSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                // buyTokensWithPoly transaction
                await I_USDTieredSTO.buyTokensWithPoly(
                    (1000 * Math.pow(10, 18)),
                    {from : account_investor1, gas: 6000000 }
                );
                } catch(error) {
                    console.log(`         tx revert -> Cap reached`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should failed at the time of buying the tokens -- Because STO get expired", async() => {
                await increaseTime(duration.days(31)); // increased beyond the end time of the STO
                let errorThrown = false;
                try {
                    await I_PolyToken.approve(I_USDTieredSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                    // buyTokensWithPoly transaction
                    await I_USDTieredSTO.buyTokensWithPoly(
                        (1000 * Math.pow(10, 18)),
                        {from : account_investor1, gas: 6000000 }
                    );
                } catch(error) {
                    console.log(`         tx revert -> STO expiry reached`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fundRaised value equal to the raised value in the funds receiver wallet", async() => {
                const balanceRaised = await I_PolyToken.balanceOf.call(account_fundsReceiver);
                assert.equal(
                    (await I_USDTieredSTO.fundsRaised.call()).toNumber(),
                    balanceRaised,
                    "Somewhere raised money get stolen or sent to wrong wallet"
                );
            });

         });

         describe("Test cases for the USDTieredSTOFactory", async() => {
            it("should get the exact details of the factory", async() => {
                assert.equal((await I_USDTieredSTOFactory.setupCost.call()).toNumber(), USDTieredSTOSetupCost);
                assert.equal(await I_USDTieredSTOFactory.getType.call(),3);
                assert.equal(web3.utils.toAscii(await I_USDTieredSTOFactory.getName.call())
                            .replace(/\u0000/g, ''),
                            "USDTieredSTO",
                            "Wrong Module added");
                assert.equal(await I_USDTieredSTOFactory.getDescription.call(),
                            "Capped STO",
                            "Wrong Module added");
                assert.equal(await I_USDTieredSTOFactory.getTitle.call(),
                            "Capped STO",
                            "Wrong Module added");
                assert.equal(await I_USDTieredSTOFactory.getInstructions.call(),
                            "Initialises a capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY/ETH to token rate), _fundRaiseType (whether you are raising in POLY or ETH), _polyToken (address of POLY token), _fundsReceiver (address which will receive funds)",
                            "Wrong Module added");
                let tags = await I_USDTieredSTOFactory.getTags.call();
                assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''),"Capped");

            });
         });

         describe("Test cases for the get functions of the capped sto", async() => {
             it("Should verify the cap reached or not", async() => {
                assert.isTrue(await I_USDTieredSTO.capReached.call());
             });

             it("Should get the raised amount of ether", async() => {
                assert.equal(await I_USDTieredSTO.getRaisedEther.call(), web3.utils.toWei('0','ether'));
             });

             it("Should get the raised amount of poly", async() => {
                assert.equal((await I_USDTieredSTO.getRaisedPOLY.call()).toNumber(), web3.utils.toWei('10000','ether'));
             });

             it("Should get the investors", async() => {
                assert.equal(await I_USDTieredSTO.getNumberInvestors.call(),2);
             });

             it("Should get the listed permissions", async() => {
                let tx = await I_USDTieredSTO.getPermissions.call();
                assert.equal(tx.length,0);
             });

             it("Should get the metrics of the STO", async() => {
                let metrics = await I_USDTieredSTO.getSTODetails.call();
                assert.isTrue(metrics[7]);
             });

         }); */
    });

});
