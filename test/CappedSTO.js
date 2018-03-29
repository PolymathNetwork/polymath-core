import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import { increaseTime } from './helpers/time';

const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require("./TickerRegistry.sol");
const STVersion = artifacts.require('./STVersionProxy_001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyToken = artifacts.require('./PolyToken.sol');
const PolyTokenFaucet = artifacts.require('./helpers/contracts/PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('CappedSTO', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;

    let balanceOfReceiver;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);
    let P_fromTime = fromTime + duration.days(1);
    let P_toTime = P_fromTime + duration.days(50);

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory;
    let I_STVersion;
    let I_SecurityToken;
    let I_CappedSTO;
    let I_PolyToken;
    let I_PolyFaucet;

    // SecurityToken Details for funds raise Type ETH
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
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Capped STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(30);                     // Add 30 days more
    const cap = new BigNumber(10000).times(new BigNumber(10).pow(18));
    const rate = 1000;
    const fundRaiseType = 0;
    const P_cap = new BigNumber(50000).times(new BigNumber(10).pow(18));
    const P_fundRaiseType = 1;
    const P_rate = 5;
    const P_startTime = endTime + duration.days(2);
    const P_endTime = P_startTime + duration.days(30);
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
            type: 'uint256',
            name: '_rate'
        },{
            type: 'uint8',
            name: '_fundRaiseType',
        },{
            type: 'address',
            name: '_polyToken'
        },{
            type: 'address',
            name: '_fundsReceiver'
        }
        ]
    };

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[2];
        account_investor2 = accounts[3];
        account_fundsReceiver = accounts[4];
        token_owner = account_issuer;

        // ----------- POLYMATH NETWORK Configuration ------------

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new({from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new({from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new({ from: token_owner });

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: token_owner });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new({ from: account_polymath });

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, I_GeneralPermissionManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step ANY: Deploy the Polytoken Contract
         I_PolyToken = await PolyToken.new();

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

        // Step 8: Set the STR in TickerRegistry
        await I_TickerRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});
        await I_ModuleRegistry.setTokenRegistry(I_SecurityTokenRegistry.address, {from: account_polymath});

        // Step 9: Deploy the token Faucet
        I_PolyFaucet = await PolyTokenFaucet.new();

        // Printing all the contract addresses
        console.log(`\nPolymath Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            CappedSTOFactory: ${I_CappedSTOFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            let tx = await I_TickerRegistry.registerTicker(symbol, name, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._symbol, symbol.toLowerCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, decimals, tokenDetails, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toLowerCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralPermissionManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), permissionManagerKey);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralPermissionManager"
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

           moduleData = await I_SecurityToken.modules(permissionManagerKey, 0);
           I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralPermissionManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManager contract was not deployed",
           );
        });

        it("Should fail to launch the STO due to rate is 0", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, cap, 0, fundRaiseType, I_PolyToken.address, account_fundsReceiver]);

            try {
            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, false, { from: token_owner, gas: 2500000 });
            } catch(error) {
                console.log(`Tx Failed because of rate is ${0}. Test Passed Successfully`);
                ensureException(error);
            }
        });

        it("Should fail to launch the STO due to startTime > endTime", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [ Math.floor(Date.now()/1000 + 100000), Math.floor(Date.now()/1000 + 1000), cap, rate, fundRaiseType, I_PolyToken.address, account_fundsReceiver]);

            try {
            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, false, { from: token_owner, gas: 2500000 });
            } catch(error) {
                console.log(`Tx Failed because of startTime is greater than endTime. Test Passed Successfully`);
                ensureException(error);
            }
        });

        it("Should fail to launch the STO due to cap is of 0 securityToken", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [ startTime, endTime, 0, rate, fundRaiseType, I_PolyToken.address, account_fundsReceiver]);

            try {
            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, false, { from: token_owner, gas: 2500000 });
            } catch(error) {
                console.log(`Tx Failed because the Cap is equal to ${0}. Test Passed Successfully`);
                ensureException(error);
            }
        });


        it("Should successfully attach the STO factory with the security token", async () => {
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, cap, rate, fundRaiseType, I_PolyToken.address, account_fundsReceiver]);
            
            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, false, { from: token_owner, gas: 2500000 });

            assert.equal(tx.logs[2].args._type, stoKey, "CappedSTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "CappedSTO",
                "CappedSTOFactory module was not added"
            );
            I_CappedSTO = CappedSTO.at(tx.logs[2].args._module);
        });
    });

    describe("verify the data of STO", async () => {

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                await I_CappedSTO.startTime.call(),
                startTime,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO.endTime.call(),
                endTime,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO.cap.call()).toNumber(),
                cap,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO.rate.call(),
                rate,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO.fundraiseType.call(),
                fundRaiseType,
                "STO Configuration doesn't set as expected"
            );
        });
    });
    describe("Buy tokens", async() => {

        it("Should buy the tokens -- failed due to startTime is greater than Current time", async () => {
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`Failed due to startTime is greater than Current time`);
                ensureException(error);
            }
        });

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`Failed because investor doesn't present in the whitelist`);
                ensureException(error);
            }
        });

        it("Should Buy the tokens", async() => {
            balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                fromTime,
                toTime,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);
            // Fallback transaction
            await web3.eth.sendTransaction({
                from: account_investor1,
                to: I_CappedSTO.address,
                gas: 210000,
                value: web3.utils.toWei('1', 'ether')
              });

            assert.equal(
                (await I_CappedSTO.fundsRaised.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1
            );

            assert.equal(await I_CappedSTO.getNumberInvestors.call(), 1);

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000
            );
        });

        it("Verification of the event Token Purchase", async() => {
            let TokenPurchase = I_CappedSTO.allEvents();
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

        it("Should restrict to buy tokens after hiting the cap in second tx first tx pass", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                fromTime,
                toTime + duration.days(20),
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

             // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_CappedSTO.address,
                gas: 210000,
                value: web3.utils.toWei('9', 'ether')
              });

              assert.equal(
                (await I_CappedSTO.fundsRaised.call())
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                10
            );

            assert.equal(await I_CappedSTO.getNumberInvestors.call(), 2);

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
                to: I_CappedSTO.address,
                gas: 210000,
                value: web3.utils.toWei('1', 'ether')
              });
            } catch(error) {
                console.log(`failed Because of capped reached`);
                ensureException(error);
            }
        });

        it("Should failed at the time of buying the tokens -- Because STO get expired", async() => {
            await increaseTime(duration.days(16)); // increased beyond the end time of the STO

            try {
                // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_CappedSTO.address,
                gas: 210000,
                value: web3.utils.toWei('1', 'ether')
              });
            } catch(error) {
                console.log(`failed Because STO get expired reached`);
                ensureException(error);
            }

        });

        it("Should fundRaised value equal to the raised value in the funds receiver wallet", async() => {
            const newBalance = await web3.eth.getBalance(account_fundsReceiver);
            assert.equal(
                (await I_CappedSTO.fundsRaised.call()).toNumber(),
                (newBalance - balanceOfReceiver),
                "Somewhere raised money get stolen or sent to wrong wallet"
            );
        });

    });

    describe("Test Cases for an STO of fundraise type POLY", async() => {

        describe("Launch a new SecurityToken", async() => {

            it("POLY: Should register the ticker before the generation of the security token", async () => {
                let tx = await I_TickerRegistry.registerTicker(P_symbol, P_name, { from : token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._symbol, P_symbol.toLowerCase());
            });

            it("POLY: Should generate the new security token with the same symbol as registered above", async () => {
                let tx = await I_SecurityTokenRegistry.generateSecurityToken(P_name, P_symbol, P_decimals, P_tokenDetails, { from: token_owner });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, P_symbol.toLowerCase(), "SecurityToken doesn't get deployed");

                I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

                const LogAddModule = await I_SecurityToken.allEvents();
                const log = await new Promise(function(resolve, reject) {
                    LogAddModule.watch(function(error, log){ resolve(log);});
                });

                // Verify that GeneralPermissionManager module get added successfully or not
                assert.equal(log.args._type.toNumber(), permissionManagerKey);
                assert.equal(
                    web3.utils.toAscii(log.args._name)
                    .replace(/\u0000/g, ''),
                    "GeneralPermissionManager"
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

                moduleData = await I_SecurityToken.modules(permissionManagerKey, 0);
                I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData[1]);

                assert.notEqual(
                 I_GeneralPermissionManager.address.valueOf(),
                 "0x0000000000000000000000000000000000000000",
                 "GeneralDelegateManager contract was not deployed",
                );
             });

             it("POLY: Should successfully attach the STO factory with the security token", async () => {
                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [P_startTime, P_endTime, P_cap, P_rate, P_fundRaiseType, I_PolyFaucet.address, account_fundsReceiver]);

                const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, 0, 0, false, { from: token_owner, gas: 2500000 });

                assert.equal(tx.logs[2].args._type, stoKey, "CappedSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[2].args._name)
                    .replace(/\u0000/g, ''),
                    "CappedSTO",
                    "CappedSTOFactory module was not added"
                );
                I_CappedSTO = CappedSTO.at(tx.logs[2].args._module);
            });

        });

        describe("verify the data of STO", async () => {

            it("Should verify the configuration of the STO", async() => {
                assert.equal(
                    (await I_CappedSTO.startTime.call()).toNumber(),
                    P_startTime,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO.endTime.call()).toNumber(),
                    P_endTime,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO.cap.call()).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    P_cap.dividedBy(new BigNumber(10).pow(18)),
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_CappedSTO.rate.call(),
                    P_rate,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_CappedSTO.fundraiseType.call(),
                    P_fundRaiseType,
                    "STO Configuration doesn't set as expected"
                );
            });
        });

        describe("Buy tokens", async() => {

            it("Should Buy the tokens", async() => {
                // Add the Investor in to the whitelist

                await I_PolyFaucet.getTokens((10000 * Math.pow(10, 18)), account_investor1);

                assert.equal(
                    (await I_PolyFaucet.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    10000,
                    "Tokens are not transfered properly"
                );

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    P_fromTime,
                    P_toTime,
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");

                // Jump time
                await increaseTime(duration.days(16));

                await I_PolyFaucet.approve(I_CappedSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});

                // buyTokensWithPoly transaction
                await I_CappedSTO.buyTokensWithPoly(
                    (1000 * Math.pow(10, 18)),
                    {
                        from : account_investor1,
                        gas: 5000000
                    }
                );

                assert.equal(
                    (await I_CappedSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );

                assert.equal(await I_CappedSTO.getNumberInvestors.call(), 1);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    5000
                );
            });

            it("Verification of the event Token Purchase", async() => {
                let TokenPurchase = I_CappedSTO.allEvents();
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
                    {
                        from: account_issuer,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

                await I_PolyFaucet.getTokens((10000 * Math.pow(10, 18)), account_investor2);

                await I_PolyFaucet.approve(I_CappedSTO.address, (9000 * Math.pow(10, 18)), { from: account_investor2});

                // buyTokensWithPoly transaction
                await I_CappedSTO.buyTokensWithPoly(
                    (9000 * Math.pow(10, 18)),
                    {from : account_investor2, gas: 5000000 }
                );

                  assert.equal(
                    (await I_CappedSTO.fundsRaised.call())
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    10000
                );

                assert.equal(await I_CappedSTO.getNumberInvestors.call(), 2);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    45000
                );
                try {

                await I_PolyFaucet.approve(I_CappedSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                // buyTokensWithPoly transaction
                await I_CappedSTO.buyTokensWithPoly(
                    (1000 * Math.pow(10, 18)),
                    {from : account_investor1, gas: 5000000 }
                );
                } catch(error) {
                    console.log(`failed Because of capped reached`);
                    ensureException(error);
                }
            });

            it("Should failed at the time of buying the tokens -- Because STO get expired", async() => {
                await increaseTime(duration.days(30)); // increased beyond the end time of the STO

                try {
                    await I_PolyFaucet.approve(I_CappedSTO.address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                    // buyTokensWithPoly transaction
                    await I_CappedSTO.buyTokensWithPoly(
                        (1000 * Math.pow(10, 18)),
                        {from : account_investor1, gas: 5000000 }
                    );
                } catch(error) {
                    console.log(`failed Because STO get expired reached`);
                    ensureException(error);
                }

            });

            it("Should fundRaised value equal to the raised value in the funds receiver wallet", async() => {
                const balanceRaised = await I_PolyFaucet.balanceOf.call(account_fundsReceiver);
                assert.equal(
                    (await I_CappedSTO.fundsRaised.call()).toNumber(),
                    balanceRaised,
                    "Somewhere raised money get stolen or sent to wrong wallet"
                );
            });

         });
    });

});
