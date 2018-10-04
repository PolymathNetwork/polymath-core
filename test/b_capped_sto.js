import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port
let ETH = 0;
let POLY = 1;
let DAI = 2;

contract('CappedSTO', accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_fundsReceiver;

    let balanceOfReceiver;
    let message = "Transaction Should Fail!";
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;
    let P_fromTime;
    let P_toTime;
    let P_expiryTime;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_SecurityTokenRegistry;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_CappedSTOFactory;
    let I_STFactory;
    let I_SecurityToken_ETH;
    let I_SecurityToken_POLY;
    let I_CappedSTO_Array_ETH = [];
    let I_CappedSTO_Array_POLY = [];
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let pauseTime;

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
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Capped STO details
    let startTime_ETH1;
    let endTime_ETH1;
    let startTime_ETH2;
    let endTime_ETH2;
    const cap = web3.utils.toWei("10000");
    const rate = 1000;
    const E_fundRaiseType = 0;

    let startTime_POLY1;
    let endTime_POLY1;
    let startTime_POLY2;
    let endTime_POLY2;
    let blockNo;
    const P_cap = web3.utils.toWei("50000");
    const P_fundRaiseType = 1;
    const P_rate = 5;
    const cappedSTOSetupCost= web3.utils.toWei("20000","ether");
    const maxCost = cappedSTOSetupCost;
    const STOParameters = ['uint256', 'uint256', 'uint256', 'uint256', 'uint8[]', 'address'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[4];
        account_investor2 = accounts[3];
        account_investor3 = accounts[5]
        account_fundsReceiver = accounts[2];
        token_owner = account_issuer;

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

        // STEP 6: Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, cappedSTOSetupCost, 0, 0, { from: token_owner });

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
        );

        // Step 8: Deploy the STFactory contract

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // Step 9: Deploy the SecurityTokenRegistry contract

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: Deploy the proxy and attach the implementation contract to it.
         I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
         let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
         await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
         I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});

        // STEP 7: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        console.log(await I_MRProxied.owner());
        console.log(account_polymath);
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STOFactory
        await I_MRProxied.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_CappedSTOFactory.address, true, { from: account_polymath });


        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${ModuleRegistryProxy.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken_ETH = SecurityToken.at(tx.logs[1].args._securityTokenAddress);


            const log = await promisifyLogWatch(I_SecurityToken_ETH.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = (await I_SecurityToken_ETH.getModulesByType(transferManagerKey))[0];
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should mint the tokens before attaching the STO", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken_ETH.mint("0x0000000000000000000000000000000000000000", web3.utils.toWei("1"), {from: token_owner});
            } catch (error) {
                console.log(`       tx -> revert 0x address is not allowed as investor`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to launch the STO due to security token doesn't have the sufficient POLY", async () => {
            let startTime = latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, 0, [E_fundRaiseType], account_fundsReceiver]);
            let errorThrown = false;
            try {
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> Rate is ${0}. Test Passed Successfully`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to launch the STO due to rate is 0", async () => {
            let startTime = latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, cappedSTOSetupCost, { from: token_owner});

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, 0, [E_fundRaiseType], account_fundsReceiver]);
            let errorThrown = false;
            try {
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
            } catch(error) {
                console.log(`Tx Failed because of rate is ${0}. Test Passed Successfully`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to launch the STO due to startTime > endTime", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [ Math.floor(Date.now()/1000 + 100000), Math.floor(Date.now()/1000 + 1000), cap, rate, [E_fundRaiseType], account_fundsReceiver]);
            let errorThrown = false;
            try {
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
            } catch(error) {
                errorThrown = true;
                console.log(`         tx revert -> StartTime is greater than endTime. Test Passed Successfully`.grey);
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to launch the STO due to cap is of 0 securityToken", async () => {
            let startTime = latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [ startTime, endTime, 0, rate, [E_fundRaiseType], account_fundsReceiver]);
            let errorThrown = false;
            try {
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
            } catch(error) {
                console.log(`Tx Failed because the Cap is equal to ${0}. Test Passed Successfully`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the STO module to the security token", async () => {
            startTime_ETH1 = latestTime() + duration.days(1);
            endTime_ETH1 = startTime_ETH1 + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime_ETH1, endTime_ETH1, cap, rate, [E_fundRaiseType], account_fundsReceiver]);
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name),"CappedSTO","CappedSTOFactory module was not added");
            I_CappedSTO_Array_ETH.push(CappedSTO.at(tx.logs[3].args._module));
        });
    });

    describe("verify the data of STO", async () => {

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                await I_CappedSTO_Array_ETH[0].startTime.call(),
                startTime_ETH1,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[0].endTime.call(),
                endTime_ETH1,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_ETH[0].cap.call()).toNumber(),
                cap,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[0].rate.call(),
                rate,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[0].fundRaiseTypes.call(E_fundRaiseType),
                true,
                "STO Configuration doesn't set as expected"
            );
        });
    });

    describe("Buy tokens", async() => {

        it("Should buy the tokens -- failed due to startTime is greater than Current time", async () => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> startTime is greater than Current time`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should buy the tokens -- failed due to invested amount is zero", async () => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
                    value: web3.utils.toWei('0', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> Invested amount is zero`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
                    value: web3.utils.toWei('1', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> Investor doesn't present in the whitelist`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should buy the tokens -- Failed due to wrong granularity", async () => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
                    value: web3.utils.toWei('0.1111', 'ether')
                  });
            } catch(error) {
                console.log(`         tx revert -> Wrong purchase granularity`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should Buy the tokens", async() => {
            blockNo = latestBlock();
            fromTime = latestTime();
            toTime = latestTime() + duration.days(15);
            expiryTime = toTime + duration.days(100);
            P_fromTime = fromTime + duration.days(1);
            P_toTime = P_fromTime + duration.days(50);
            P_expiryTime = toTime + duration.days(100);

            balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
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
            // Fallback transaction
            await web3.eth.sendTransaction({
                from: account_investor1,
                to: I_CappedSTO_Array_ETH[0].address,
                gas: 2100000,
                value: web3.utils.toWei('1', 'ether')
              });

            assert.equal(
                (await I_CappedSTO_Array_ETH[0].getRaised.call(ETH))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1
            );

            assert.equal(await I_CappedSTO_Array_ETH[0].investorCount.call(), 1);

            assert.equal(
                (await I_SecurityToken_ETH.balanceOf(account_investor1))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000
            );
        });

        it("Verification of the event Token Purchase", async() => {
            const log = await promisifyLogWatch(I_CappedSTO_Array_ETH[0].TokenPurchase({from: blockNo}), 1);

            assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
            assert.equal(
                (log.args.amount)
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000,
                "Wrong No. token get dilivered"
            );
        });

        it("Should pause the STO -- Failed due to wrong msg.sender", async()=> {
            let errorThrown = false;
            try {
                let tx = await I_CappedSTO_Array_ETH[0].pause({from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> Wrong msg.sender`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should pause the STO", async()=> {
            pauseTime = latestTime();
            let tx = await I_CappedSTO_Array_ETH[0].pause({from: account_issuer});
            assert.isTrue(await I_CappedSTO_Array_ETH[0].paused.call());
        });

        it("Should fail to buy the tokens after pausing the STO", async() => {
            let errorThrown = false;
            try {
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
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
                let tx = await I_CappedSTO_Array_ETH[0].unpause({from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> Wrong msg.sender`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should unpause the STO", async()=> {
            let tx = await I_CappedSTO_Array_ETH[0].unpause({from: account_issuer});
            assert.isFalse(await I_CappedSTO_Array_ETH[0].paused.call());
        });

        it("Should buy the tokens -- Failed due to wrong granularity", async () => {
            let errorThrown = false;
            try {
                 await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO_Array_ETH[0].address,
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
                to: I_CappedSTO_Array_ETH[0].address,
                gas: 2100000,
                value: web3.utils.toWei('9', 'ether')
              });

              assert.equal(
                (await I_CappedSTO_Array_ETH[0].getRaised.call(ETH))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                10
            );

            assert.equal(await I_CappedSTO_Array_ETH[0].investorCount.call(), 2);

            assert.equal(
                (await I_SecurityToken_ETH.balanceOf(account_investor2))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                9000
            );
            try {
                // Fallback transaction
             await web3.eth.sendTransaction({
                from: account_investor2,
                to: I_CappedSTO_Array_ETH[0].address,
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
                to: I_CappedSTO_Array_ETH[0].address,
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
            //console.log("WWWW",newBalance,await I_CappedSTO.fundsRaised.call(),balanceOfReceiver);
            let op = (BigNumber(newBalance).minus(balanceOfReceiver)).toNumber();
            assert.equal(
                (await I_CappedSTO_Array_ETH[0].getRaised.call(ETH)).toNumber(),
                op,
                "Somewhere raised money get stolen or sent to wrong wallet"
            );
        });

        it("Should get the raised amount of ether", async() => {
            assert.equal(await I_CappedSTO_Array_ETH[0].getRaised.call(ETH), web3.utils.toWei('10','ether'));
        });

        it("Should get the raised amount of poly", async() => {
            assert.equal((await I_CappedSTO_Array_ETH[0].getRaised.call(POLY)).toNumber(), web3.utils.toWei('0','ether'));
         });

    });

    describe("Reclaim poly sent to STO by mistake", async() => {

        it("Should fail to reclaim POLY because token contract address is 0 address", async() => {
            let value = web3.utils.toWei('100','ether');
            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_CappedSTO_Array_ETH[0].address, value, { from: account_investor1 });

            let errorThrown = false;
            try {
                 await I_CappedSTO_Array_ETH[0].reclaimERC20('0x0000000000000000000000000000000000000000', { from: token_owner });
            } catch(error) {
                console.log(`         tx revert -> token contract address is 0 address`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully reclaim POLY", async() => {
            let initInvestorBalance = await I_PolyToken.balanceOf(account_investor1);
            let initOwnerBalance = await I_PolyToken.balanceOf(token_owner);
            let initContractBalance = await I_PolyToken.balanceOf(I_CappedSTO_Array_ETH[0].address);
            let value = web3.utils.toWei('100','ether');

            await I_PolyToken.getTokens(value, account_investor1);
            await I_PolyToken.transfer(I_CappedSTO_Array_ETH[0].address, value, { from: account_investor1 });
            await I_CappedSTO_Array_ETH[0].reclaimERC20(I_PolyToken.address, { from: token_owner });
            assert.equal((await I_PolyToken.balanceOf(account_investor3)).toNumber(), initInvestorBalance.toNumber(), "tokens are not transfered out from investor account");
            assert.equal((await I_PolyToken.balanceOf(token_owner)).toNumber(), initOwnerBalance.add(value).add(initContractBalance).toNumber(), "tokens are not added to the owner account");
            assert.equal((await I_PolyToken.balanceOf(I_CappedSTO_Array_ETH[0].address)).toNumber(), 0, "tokens are not trandfered out from STO contract");
        });
    });

    describe("Attach second ETH STO module", async() => {

        it("Should successfully attach the second STO module to the security token", async () => {
            startTime_ETH2 = latestTime() + duration.days(1);
            endTime_ETH2 = startTime_ETH2 + duration.days(30);

            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, cappedSTOSetupCost, { from: token_owner});
            let bytesSTO = encodeModuleCall(STOParameters, [startTime_ETH2, endTime_ETH2, cap, rate, [E_fundRaiseType], account_fundsReceiver]);
            const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name),"CappedSTO","CappedSTOFactory module was not added");
            I_CappedSTO_Array_ETH.push(CappedSTO.at(tx.logs[3].args._module));
        });

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                await I_CappedSTO_Array_ETH[1].startTime.call(),
                startTime_ETH2,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[1].endTime.call(),
                endTime_ETH2,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_ETH[1].cap.call()).toNumber(),
                cap,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[1].rate.call(),
                rate,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_ETH[1].fundRaiseTypes.call(E_fundRaiseType),
                true,
                "STO Configuration doesn't set as expected"
            );
        });

        it("Should successfully whitelist investor 3", async() => {

            balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");

            // Jump time to beyond STO start
            await increaseTime(duration.days(2));
        });

        it("Should invest in second STO - fails due to incorrect beneficiary", async() => {

            // Buying on behalf of another user should fail
            let errorThrown = false;
            try {
                 await I_CappedSTO_Array_ETH[1].buyTokens(account_investor3, { from : account_issuer, value: web3.utils.toWei('1', 'ether') });
            } catch(error) {
                console.log(`         tx revert -> incorrect beneficiary`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

        });

        it("Should allow non-matching beneficiary", async() => {
            await I_CappedSTO_Array_ETH[1].changeAllowBeneficialInvestments(true, {from: account_issuer});
            let allow = await I_CappedSTO_Array_ETH[1].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");
        });

        it("Should invest in second STO", async() => {

            await I_CappedSTO_Array_ETH[1].buyTokens(account_investor3, { from : account_issuer, value: web3.utils.toWei('1', 'ether') });

            assert.equal(
                (await I_CappedSTO_Array_ETH[1].getRaised.call(ETH))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1
            );

            assert.equal(await I_CappedSTO_Array_ETH[1].investorCount.call(), 1);

            assert.equal(
                (await I_SecurityToken_ETH.balanceOf(account_investor3))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                1000
            );
        });
    });

    describe("Test cases for reaching limit number of STO modules", async() => {

        it("Should successfully attach 10 STO modules", async () => {
            const MAX_MODULES = 10;
            let startTime = latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);

            await I_PolyToken.getTokens(cappedSTOSetupCost*19, token_owner);
            await I_PolyToken.transfer(I_SecurityToken_ETH.address, cappedSTOSetupCost*19, { from: token_owner});
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, [E_fundRaiseType], account_fundsReceiver]);

            for (var STOIndex = 2; STOIndex < MAX_MODULES; STOIndex++) {
                const tx = await I_SecurityToken_ETH.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
                assert.equal(tx.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name),"CappedSTO",`Wrong STO module added at index ${STOIndex}`);
                I_CappedSTO_Array_ETH.push(CappedSTO.at(tx.logs[3].args._module));
            }

        });

        it("Should successfully invest in all STO modules attached", async () => {
            const MAX_MODULES = 10;
            await increaseTime(duration.days(2));
            for (var STOIndex = 2; STOIndex < MAX_MODULES; STOIndex++) {
                await I_CappedSTO_Array_ETH[STOIndex].buyTokens(account_investor3, { from : account_investor3, value: web3.utils.toWei('1', 'ether') });
                assert.equal(
                    (await I_CappedSTO_Array_ETH[STOIndex].getRaised.call(ETH))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1
                );
                assert.equal(await I_CappedSTO_Array_ETH[STOIndex].investorCount.call(), 1);
            }
        });
    });

    describe("Test Cases for an STO of fundraise type POLY", async() => {

        describe("Launch a new SecurityToken", async() => {

            it("POLY: Should register the ticker before the generation of the security token", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let tx = await I_STRProxied.registerTicker(token_owner, P_symbol, P_name, { from : token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._ticker, P_symbol);
            });

            it("POLY: Should generate the new security token with the same symbol as registered above", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner});
                let _blockNo = latestBlock();
                let tx = await I_STRProxied.generateSecurityToken(P_name, P_symbol, P_tokenDetails, false, { from: token_owner });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, P_symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken_POLY = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

                const log = await promisifyLogWatch(I_SecurityToken_POLY.ModuleAdded({from: _blockNo}), 1);

                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
            });

            it("POLY: Should intialize the auto attached modules", async () => {
                let moduleData = (await I_SecurityToken_POLY.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
             });

             it("POLY: Should successfully attach the STO module to the security token", async () => {
                startTime_POLY1 = latestTime() + duration.days(2);
                endTime_POLY1 = startTime_POLY1 + duration.days(30);

                await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
                await I_PolyToken.transfer(I_SecurityToken_POLY.address, cappedSTOSetupCost, { from: token_owner});

                let bytesSTO = encodeModuleCall(STOParameters, [startTime_POLY1, endTime_POLY1, P_cap, P_rate, [P_fundRaiseType], account_fundsReceiver]);

                const tx = await I_SecurityToken_POLY.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

                assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name),"CappedSTO","CappedSTOFactory module was not added");
                I_CappedSTO_Array_POLY.push(CappedSTO.at(tx.logs[3].args._module));
            });

        });

        describe("verify the data of STO", async () => {

            it("Should verify the configuration of the STO", async() => {
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].startTime.call()).toNumber(),
                    startTime_POLY1,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].endTime.call()).toNumber(),
                    endTime_POLY1,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].cap.call()).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    BigNumber(P_cap).dividedBy(new BigNumber(10).pow(18)),
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_CappedSTO_Array_POLY[0].rate.call(),
                    P_rate,
                    "STO Configuration doesn't set as expected"
                );
                assert.equal(
                    await I_CappedSTO_Array_POLY[0].fundRaiseTypes.call(P_fundRaiseType),
                    true,
                    "STO Configuration doesn't set as expected"
                );
            });
        });

        describe("Buy tokens", async() => {

            it("Should Buy the tokens", async() => {
                await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_investor1);
                blockNo = latestBlock();
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

                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, (1000 * Math.pow(10, 18)), { from: account_investor1});

                // buyTokensWithPoly transaction
                await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(
                    (1000 * Math.pow(10, 18)),
                    {
                        from : account_investor1,
                        gas: 6000000
                    }
                );

                assert.equal(
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );

                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(), 1);

                assert.equal(
                    (await I_SecurityToken_POLY.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    5000
                );
            });

            it("Verification of the event Token Purchase", async() => {
                const log = await promisifyLogWatch(I_CappedSTO_Array_POLY[0].TokenPurchase({from: blockNo}), 1);

                assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
                assert.equal(
                    (log.args.amount)
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    5000,
                    "Wrong No. token get dilivered"
                );
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

                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, (9000 * Math.pow(10, 18)), { from: account_investor2});

                // buyTokensWithPoly transaction
                await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(
                    (9000 * Math.pow(10, 18)),
                    {from : account_investor2, gas: 6000000 }
                );

                  assert.equal(
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    10000
                );

                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(), 2);

                assert.equal(
                    (await I_SecurityToken_POLY.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    45000
                );
                let errorThrown = false;
                try {

                await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                // buyTokensWithPoly transaction
                await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(
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
                    await I_PolyToken.approve(I_CappedSTO_Array_POLY[0].address, (1000 * Math.pow(10, 18)), { from: account_investor1});
                    // buyTokensWithPoly transaction
                    await I_CappedSTO_Array_POLY[0].buyTokensWithPoly(
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
                    (await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).toNumber(),
                    balanceRaised,
                    "Somewhere raised money get stolen or sent to wrong wallet"
                );
            });

         });

         describe("Test cases for the CappedSTOFactory", async() => {
            it("should get the exact details of the factory", async() => {
                assert.equal((await I_CappedSTOFactory.setupCost.call()).toNumber(), cappedSTOSetupCost);
                assert.equal((await I_CappedSTOFactory.getTypes.call())[0],3);
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.getName.call()),
                            "CappedSTO",
                            "Wrong Module added");
                assert.equal(await I_CappedSTOFactory.getDescription.call(),
                            "Use to collects the funds and once the cap is reached then investment will be no longer entertained",
                            "Wrong Module added");
                assert.equal(await I_CappedSTOFactory.getTitle.call(),
                            "Capped STO",
                            "Wrong Module added");
                assert.equal(await I_CappedSTOFactory.getInstructions.call(),
                            "Initialises a capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY/ETH to token rate), _fundRaiseType (whether you are raising in POLY or ETH), _polyToken (address of POLY token), _fundsReceiver (address which will receive funds)",
                            "Wrong Module added");
                let tags = await I_CappedSTOFactory.getTags.call();
                assert.equal(web3.utils.hexToString(tags[0]),"Capped");

            });

            it("Should fail to change the title -- bad owner", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeTitle("STO Capped", {from:account_investor1});
                } catch(error) {
                    console.log(`         tx revert -> bad owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to change the title -- zero length", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeTitle("", {from: token_owner});
                } catch(error) {
                    console.log(`         tx revert -> bad owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the title", async() => {
                await I_CappedSTOFactory.changeTitle("STO Capped", {from: token_owner});
                assert.equal(await I_CappedSTOFactory.getTitle.call(),
                            "STO Capped",
                            "Title doesn't get changed");
            });

            it("Should fail to change the description -- bad owner", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeDescription("It is only a STO", {from:account_investor1});
                } catch(error) {
                    console.log(`         tx revert -> bad owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to change the description -- zero length", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeDescription("", {from: token_owner});
                } catch(error) {
                    console.log(`         tx revert -> length of string should not be zero`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the description", async() => {
                await I_CappedSTOFactory.changeDescription("It is only a STO", {from: token_owner});
                assert.equal(await I_CappedSTOFactory.getDescription.call(),
                            "It is only a STO",
                            "Description doesn't get changed");
            });

            it("Should fail to change the name -- bad owner", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), {from:account_investor1});
                } catch(error) {
                    console.log(`         tx revert -> bad owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to change the name -- zero length", async() => {
                let errorThrown = false;
                try {
                    await I_CappedSTOFactory.changeName(web3.utils.stringToHex(""), {from: token_owner});
                } catch(error) {
                    console.log(`         tx revert -> length of string should not be zero`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully change the name", async() => {
                await I_CappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), {from: token_owner});
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.getName.call()),
                            "STOCapped",
                            "Name doesn't get changed");
            });

            it("Should successfully change the name", async() => {
                await I_CappedSTOFactory.changeName(web3.utils.stringToHex("CappedSTO"), {from: token_owner});
                assert.equal(web3.utils.hexToString(await I_CappedSTOFactory.getName.call()),
                            "CappedSTO",
                            "Name doesn't get changed");
            });

         });

         describe("Test cases for the get functions of the capped sto", async() => {
             it("Should verify the cap reached or not", async() => {
                assert.isTrue(await I_CappedSTO_Array_POLY[0].capReached.call());
             });

             it("Should get the raised amount of ether", async() => {
                assert.equal(await I_CappedSTO_Array_POLY[0].getRaised.call(ETH), web3.utils.toWei('0','ether'));
             });

             it("Should get the raised amount of poly", async() => {
                assert.equal((await I_CappedSTO_Array_POLY[0].getRaised.call(POLY)).toNumber(), web3.utils.toWei('10000','ether'));
             });

             it("Should get the investors", async() => {
                assert.equal(await I_CappedSTO_Array_POLY[0].investorCount.call(),2);
             });

             it("Should get the listed permissions", async() => {
                let tx = await I_CappedSTO_Array_POLY[0].getPermissions.call();
                assert.equal(tx.length,0);
             });

             it("Should get the metrics of the STO", async() => {
                let metrics = await I_CappedSTO_Array_POLY[0].getSTODetails.call();
                assert.isTrue(metrics[7]);
             });

         });
    });

    describe("Attach second POLY STO module", async() => {
        it("Should successfully attach a second STO to the security token", async () => {
            startTime_POLY2 = latestTime() + duration.days(1);
            endTime_POLY2 = startTime_POLY2 + duration.days(30);

            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken_POLY.address, cappedSTOSetupCost, { from: token_owner});

            let bytesSTO = encodeModuleCall(STOParameters, [startTime_POLY2, endTime_POLY2, P_cap, P_rate, [P_fundRaiseType], account_fundsReceiver]);

            const tx = await I_SecurityToken_POLY.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[3].args._name),"CappedSTO","CappedSTOFactory module was not added");
            I_CappedSTO_Array_POLY.push(CappedSTO.at(tx.logs[3].args._module));
        });

        it("Should verify the configuration of the STO", async() => {
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].startTime.call()).toNumber(),
                startTime_POLY2,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].endTime.call()).toNumber(),
                endTime_POLY2,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_CappedSTO_Array_POLY[1].cap.call()).dividedBy(new BigNumber(10).pow(18)).toNumber(),
                BigNumber(P_cap).dividedBy(new BigNumber(10).pow(18)),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_POLY[1].rate.call(),
                P_rate,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_CappedSTO_Array_POLY[1].fundRaiseTypes.call(P_fundRaiseType),
                true,
                "STO Configuration doesn't set as expected"
            );
        });

        it("Should successfully invest in second STO", async() => {

            const polyToInvest = 1000;
            const stToReceive = polyToInvest * P_rate;

            await I_PolyToken.getTokens((polyToInvest * Math.pow(10, 18)), account_investor3);

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                P_fromTime,
                P_toTime,
                P_expiryTime,
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            // Jump time to beyond STO start
            await increaseTime(duration.days(2));

            await I_PolyToken.approve(I_CappedSTO_Array_POLY[1].address, (polyToInvest * Math.pow(10, 18)), { from: account_investor3 });

            // buyTokensWithPoly transaction
            await I_CappedSTO_Array_POLY[1].buyTokensWithPoly(
                (polyToInvest * Math.pow(10, 18)),
                {
                    from : account_investor3,
                    gas: 6000000
                }
            );

            assert.equal(
                (await I_CappedSTO_Array_POLY[1].getRaised.call(POLY))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                polyToInvest
            );

            assert.equal(await I_CappedSTO_Array_POLY[1].investorCount.call(), 1);

            assert.equal(
                (await I_SecurityToken_POLY.balanceOf(account_investor3))
                .dividedBy(new BigNumber(10).pow(18))
                .toNumber(),
                stToReceive
            );
        });
    });
});
