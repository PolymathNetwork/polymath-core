import latestTime from './helpers/latestTime';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployVRTMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager.sol');
const VolumeRestrictionTM = artifacts.require('./VolumeRestrictionTM.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VolumeRestrictionTransferManager', accounts => {

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
    let account_delegate2;
    let account_delegate3;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_VolumeRestrictionTMFactory;
    let P_VolumeRestrictionTMFactory;
    let I_SecurityTokenRegistryProxy;
    let P_VolumeRestrictionTM;
    let I_GeneralTransferManagerFactory;
    let I_VolumeRestrictionTM;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    let tempAmount = new BigNumber(0);
    let tempArray = new Array();
    let tempArray3 = new Array();
    let tempArrayGlobal = new Array();

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    async function print(data, account) {
        console.log(`
            Latest timestamp: ${data[0].toNumber()}
            SumOfLastPeriod: ${data[1].dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Days Covered: ${data[2].toNumber()}
            Latest timestamp daily: ${data[3].toNumber()}
            Individual Total Trade on latestTimestamp : ${(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[0]))
            .dividedBy(new BigNumber(10).pow(18)).toNumber()}
            Individual Total Trade on daily latestTimestamp : ${(await I_VolumeRestrictionTM.getTotalTradedByUser.call(account, data[3]))
                .dividedBy(new BigNumber(10).pow(18)).toNumber()}
        `)
    }

    async function calculateSum(rollingPeriod, tempArray) {
        let sum = 0;
        let start = 0;
        if (tempArray.length >= rollingPeriod)
            start = tempArray.length - rollingPeriod;
        for (let i = start; i < tempArray.length; i++) {
            sum += tempArray[i];
        }
        return sum;
    }

    async function printIR(data) {
            console.log(`
                Allowed Tokens  : ${data[0].dividedBy(new BigNumber(10).pow(18)).toNumber()}
                StartTime       : ${data[1].toNumber()}
                Rolling Period  : ${data[2].toNumber()} 
                EndTime         : ${data[3].toNumber()} 
                Restriction Type: ${data[4].toNumber() == 0 ? "Fixed" : "Percentage"}  
            `)
    }

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_investor3 = accounts[4];
        account_investor4 = accounts[3];
        account_delegate = accounts[7];
        account_delegate2 = accounts[6];
        account_delegate3 = accounts[5];

        // Step 1: Deploy the genral PM ecosystem
        let instances = await setUpPolymathNetwork(account_polymath, token_owner);

        [
            I_PolymathRegistry,
            I_PolyToken,
            I_FeatureRegistry,
            I_ModuleRegistry,
            I_ModuleRegistryProxy,
            I_MRProxied,
            I_GeneralTransferManagerFactory,
            I_STFactory,
            I_SecurityTokenRegistry,
            I_SecurityTokenRegistryProxy,
            I_STRProxied
        ] = instances;

        // STEP 5: Deploy the VolumeRestrictionTMFactory
        [I_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 6: Deploy the VolumeRestrictionTMFactory
        [P_VolumeRestrictionTMFactory] = await deployVRTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy                ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        VolumeRestrictionTMFactory:        ${I_VolumeRestrictionTMFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, true, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Attach the VRTMaaaaa", async() => {
        it("Deploy the VRTM and attach with the ST", async()=> {
            let tx = await I_SecurityToken.addModule(I_VolumeRestrictionTMFactory.address, 0, 0, 0, {from: token_owner });
            assert.equal(tx.logs[2].args._moduleFactory, I_VolumeRestrictionTMFactory.address);
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "VolumeRestrictionTM",
                "VolumeRestrictionTMFactory doesn not added");
            I_VolumeRestrictionTM = VolumeRestrictionTM.at(tx.logs[2].args._module);
        });

        it("Transfer some tokens to different account", async() => {
            // Add tokens in to the whitelist
            await I_GeneralTransferManager.modifyWhitelistMulti(
                    [account_investor1, account_investor2, account_investor3],
                    [latestTime(), latestTime(), latestTime()],
                    [latestTime(), latestTime(), latestTime()],
                    [latestTime() + duration.days(60), latestTime() + duration.days(60), latestTime() + duration.days(60)],
                    [true, true, true],
                    {
                        from: token_owner
                    }
            );

            // Mint some tokens and transferred to whitelisted addresses
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("100", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("30", "ether"), {from: token_owner});
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("30", "ether"), {from: token_owner});

        });

    });

    describe("Fuzz test", async () => {

        it("Should work with multiple transaction within 1 day with Individual and daily Restrictions", async() => {
            // let snapId = await takeSnapshot();
            
            var testRepeat = 0; 

            for (var i = 0; i < testRepeat; i++) {

                console.log("fuzzer number " + i);

                var individualRestrictTotalAmount =  Math.floor(Math.random() * 10); 
                if ( individualRestrictTotalAmount == 0 ) {
                    individualRestrictTotalAmount = 1;
                }

                var dailyRestrictionAmount = Math.floor(Math.random() * 10); 
                if ( dailyRestrictionAmount == 0 ) {
                    dailyRestrictionAmount = 1;
                }
                var rollingPeriod = 2; 
                var sumOfLastPeriod = 0; 

                console.log("a");
                
                // 1 - add individual restriction with a random number
                let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei(individualRestrictTotalAmount.toString()),
                    latestTime() + duration.seconds(2),
                    rollingPeriod,
                    latestTime() + duration.days(3),
                    0,
                    {
                        from: token_owner
                    }
                );     

               console.log("b");
                tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                    account_investor1,
                    web3.utils.toWei(dailyRestrictionAmount.toString()),
                    latestTime() + duration.seconds(1),
                    latestTime() + duration.days(4),
                    0,
                    {
                        from: token_owner
                    }
                );
                  
                console.log("c");
                var txNumber = 10; // define fuzz test amount for tx within 24 hrs

                for (var j=0; j<txNumber; j++) {

                    await increaseTime(duration.seconds(Math.round(20/txNumber*3600)));
                    console.log("3");

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * 10);
                    // var transactionAmount = 1;
                    var accumulatedTxValue = transactionAmount+sumOfLastPeriod;

                    console.log("sumOfLastPeriod is " + sumOfLastPeriod + " transactionAmount is " + transactionAmount + " individualRestrictTotalAmount is " + individualRestrictTotalAmount + " dailyRestrictionAmount is " + dailyRestrictionAmount);

                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if (accumulatedTxValue > individualRestrictTotalAmount || accumulatedTxValue > dailyRestrictionAmount) {
                        console.log("tx should fail");

                        await catchRevert(
                            I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1})
                        );

                        console.log("tx failed as expected due to over limit");

                    } else if (accumulatedTxValue <= individualRestrictTotalAmount && accumulatedTxValue <= dailyRestrictionAmount) {
                        console.log("tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        sumOfLastPeriod = sumOfLastPeriod + transactionAmount;

                        console.log("tx succeeded");
                    }
                    console.log("2");
                }

                // await revertToSnapshot(snapId);
                await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor1, {from: token_owner});
                await I_VolumeRestrictionTM.removeIndividualDailyRestriction(account_investor1, {from: token_owner});
            }
        });

        it("Should work with fuzz test for individual restriction and general restriction", async() => {
            // let snapId = await takeSnapshot();         
            var testRepeat = 0;

            for (var i = 0; i < testRepeat; i++) {

                console.log("fuzzer number " + i);

                var individualRestrictTotalAmount =  Math.floor(Math.random() * 10); 
                 if (individualRestrictTotalAmount == 0 ) {
                    individualRestrictTotalAmount = 1;
                }
                var defaultRestrictionAmount = Math.floor(Math.random() * 10); 
                var rollingPeriod = 2; 
                var sumOfLastPeriod = 0; 

                console.log("a");
                
                // 1 - add individual restriction with a random number
                let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei(individualRestrictTotalAmount.toString()),
                    latestTime() + duration.seconds(1),
                    rollingPeriod,
                    latestTime() + duration.days(3),
                    0,
                    {
                        from: token_owner
                    }
                );     

               console.log("b");
                tx = await I_VolumeRestrictionTM.addDefaultRestriction(
                    account_investor1,
                    latestTime() + duration.seconds(1),
                    rollingPeriod,
                    latestTime() + duration.days(4),
                    0,
                    {
                        from: token_owner
                    }
                );
                    
                console.log("c");
                var txNumber = 10; // define fuzz test amount for tx 

                for (var j = 0; j < txNumber; j++) {
                    await increaseTime(duration.seconds(5));
                    console.log("2");

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * 10);
                    var accumulatedTxValue = transactionAmount + sumOfLastPeriod;

                    console.log("sumOfLastPeriod is " + sumOfLastPeriod + " transactionAmount is " + transactionAmount + " individualRestrictTotalAmount is " + individualRestrictTotalAmount + " defaultRestrictionAmount is " + defaultRestrictionAmount);


                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if (accumulatedTxValue > individualRestrictTotalAmount || accumulatedTxValue > defaultRestrictionAmount) {
                        console.log("tx should fail");

                        await catchRevert(
                            I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1})
                        );

                        console.log("tx failed as expected due to over limit");
                    } else if (accumulatedTxValue <= individualRestrictTotalAmount) {

                        console.log("tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        sumOfLastPeriod = sumOfLastPeriod + transactionAmount;

                        console.log("tx succeeded");
                    }
                    console.log("3");
                };


                // remove individual restriction and it should fall to default restriction
                await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor1, {from: token_owner});
                console.log("individual restriction now removed --> fall back to default restriction");
                
                for (var j=0; j<txNumber; j++) {

                    await increaseTime(duration.seconds(5));
                    console.log("4");

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * 10);
                    var accumulatedTxValue = transactionAmount+sumOfLastPeriod;

                    console.log("sumOfLastPeriod is " + sumOfLastPeriod + " transactionAmount is " + transactionAmount + " defaultRestrictionAmount is " + defaultRestrictionAmount);


                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if (accumulatedTxValue > defaultRestrictionAmount) {
                        console.log("tx should fail");
                        await catchRevert( 
                            I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1})
                        );
                        console.log("tx failed as expected due to over limit");
                    } else if ( accumulatedTxValue <= defaultRestrictionAmount ) {
                        
                        console.log("tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        sumOfLastPeriod = sumOfLastPeriod + transactionAmount;

                        console.log("tx succeeded");
                    }
                    console.log("5");
                }


                // await revertToSnapshot(snapId);
                await I_VolumeRestrictionTM.removeDefaultRestriction(account_investor1, {from: token_owner});
            }

        });



        it("Should work with fuzz test for randomly adding / removing individual daily restriction and perform multipel transactions", async() => {


            var testRepeat = 0;
            var txNumber = 10;
            var dailyRestriction = false;
            var startTime = 1;
            var sumOfLastPeriod = 0;
            var accumulatedTimeIncrease = 0;
            var dailyLimitUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            for (var i = 0; i < testRepeat; i++) {

                // randomly add or removing existing daily restriction
                var random_action = Math.random() >= 0.5; // true -> add false -> remove

                if (dailyRestriction === false && random_action === true) {
                    console.log("1");

                    var dailyRestrictionAmount =  Math.floor(Math.random() * 10);
                    if (dailyRestrictionAmount === 0) {
                        dailyRestrictionAmount = 1;
                    }

                    // add daily restriction
                    let tx = await I_VolumeRestrictionTM.addIndividualDailyRestriction(
                        account_investor1,
                        web3.utils.toWei(dailyRestrictionAmount.toString()),
                        latestTime() + duration.seconds(startTime),
                        latestTime() + duration.days(50),
                        0,
                        {
                            from: token_owner
                        }
                    );

                    dailyRestriction = true;

                    console.log("added daily restriction");
                } else if (dailyRestriction === true && random_action === false) {
                    console.log("2");
                    // remove daily restriction
                    await I_VolumeRestrictionTM.removeIndividualDailyRestriction(account_investor1, {from: token_owner});
                    console.log("removed daily restriction");

                    dailyRestriction = false;
                }

                // perform multiple transactions

                for (var j = 0; j < txNumber; j++) {
                    var timeIncreaseBetweenTx = Math.floor(Math.random() * 10) * 3600; 

                    await increaseTime(duration.seconds(timeIncreaseBetweenTx));
                    accumulatedTimeIncrease = timeIncreaseBetweenTx + accumulatedTimeIncrease;
                    console.log("4");

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * 10);
                    
                    // check today's limit
                    var dayNumber = Math.floor(accumulatedTimeIncrease/(24*3600)) + 1;

                    var todayLimitUsed = dailyLimitUsed[dayNumber];

                    console.log("todayLimitUsed is " + todayLimitUsed + " transactionAmount is " + transactionAmount + " dayNumber is " + dayNumber + " dailyRestrictionAmount is " + dailyRestrictionAmount);

                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if ((todayLimitUsed + transactionAmount) > dailyRestrictionAmount) {
                        console.log("tx should fail");

                        await catchRevert(
                            I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1})
                        );

                        console.log("tx failed as expected due to over limit");
                    } else if ((todayLimitUsed + transactionAmount) <= dailyRestrictionAmount) {
                       
                        console.log("tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        dailyLimitUsed[dayNumber] = dailyLimitUsed[dayNumber] + transactionAmount;

                        console.log("tx succeeded");
                    }
                    console.log("5");
                }

                if (dailyRestriction === true) {

                    // remove daily restriction
                    await I_VolumeRestrictionTM.removeIndividualDailyRestriction(account_investor1, {from: token_owner});
                    console.log("removed daily restriction");
                }

            }

        });




        it("should work in all cases if a sender is added in the exception list", async () => {
            var testRepeat = 0;

            for (var i = 0; i < testRepeat; i++) {
                console.log("fuzzer number " + i);

                var individualRestrictTotalAmount =  Math.floor(Math.random() * 10); 
                 if (individualRestrictTotalAmount === 0 ) {
                    individualRestrictTotalAmount = 1;
                }
                var defaultRestrictionAmount = Math.floor(Math.random() * 10); 
                var rollingPeriod = 2; 
                var sumOfLastPeriod = 0; 

                console.log("a");

                // 1 - add individual restriction with a random number
                let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei(individualRestrictTotalAmount.toString()),
                    latestTime() + duration.seconds(1),
                    rollingPeriod,
                    latestTime() + duration.days(3),
                    0,
                    {
                        from: token_owner
                    }
                );

                tx = await I_VolumeRestrictionTM.changeExemptWalletList(account_investor1, true, {from: token_owner});

                console.log("b");

                var txNumber = 10; // define fuzz test amount for tx

                for (var j = 0; j < txNumber; j++) {
                    await increaseTime(duration.seconds(5));
                    console.log("2");

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * 10);
                    var accumulatedTxValue = transactionAmount + sumOfLastPeriod;

                    console.log("sumOfLastPeriod is " + sumOfLastPeriod + " transactionAmount is " + transactionAmount + " individualRestrictTotalAmount is " + individualRestrictTotalAmount + " defaultRestrictionAmount is " + defaultRestrictionAmount);

                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if (accumulatedTxValue > individualRestrictTotalAmount) {
                        console.log("tx should fail but still succeed due to investor in exempt list");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        console.log("tx passed as expected");
                    } else if (accumulatedTxValue <= individualRestrictTotalAmount) {

                        console.log("tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        sumOfLastPeriod = sumOfLastPeriod + transactionAmount;

                        console.log("tx succeeded");
                    }
                    console.log("3" + txNumber);
                };

                await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor1, {from: token_owner});
                console.log("removed daily restriction");
            }
        });

        it("Should work if IR is modified", async () => {
            
            console.log(`\t\t Starting of the IR modification test case`.blue);
            
            var testRepeat = 1;

            for (var i = 0; i < testRepeat; i++) {
                console.log("\t\t fuzzer number " + i);
                let precision = 100;
                var individualRestrictionTotalAmount = Math.floor(Math.random() * (10 * precision - 1 * precision) + 1 * precision) / (1*precision); 
                var rollingPeriod = 2; 
                var sumOfLastPeriod = 0; 

                console.log(`\t\t Add individual restriction with TotalAmount: ${individualRestrictionTotalAmount}\n`.green);
  
                // 1 - add individual restriction with a random number
                let tx = await I_VolumeRestrictionTM.addIndividualRestriction(
                    account_investor1,
                    web3.utils.toWei(individualRestrictionTotalAmount.toString()),
                    latestTime() + duration.days(2),
                    rollingPeriod,
                    latestTime() + duration.days(5),
                    0,
                    {
                        from: token_owner
                    }
                );

                console.log(`\t\t Restriction successfully added \n`);

                var txNumber = 10; // define fuzz test amount for tx

                for (var j = 0; j < txNumber; j++) {
                    console.log(`\t\t Test number: ${j}\n`);

                    // modify IR
                    var newIR =  Math.floor(Math.random() * (10 * precision - 1 * precision) + 1 * precision) / (1*precision); 

                    printIR(await I_VolumeRestrictionTM.individualRestriction(account_investor1, {from: token_owner}));
                    
                    console.log(`\t\t Modification of the IR with new startTime: ${latestTime() + duration.days(1+j)} and new total amount: ${newIR} `.green);
                    
                    await I_VolumeRestrictionTM.modifyIndividualRestriction(
                        account_investor1,
                        web3.utils.toWei(newIR.toString()),
                        latestTime() + duration.days(1+j),
                        rollingPeriod,
                        latestTime() + duration.days(5+j),
                        0,
                        { from: token_owner }
                    );

                    console.log(`\t\t Successfully IR modified`);
                    let snapId = await takeSnapshot(); 
                    await increaseTime(duration.days(2+j));

                    // generate a random amount
                    var transactionAmount = Math.floor(Math.random() * (10 * precision - 1 * precision) + 1 * precision) / (1*precision); 

                    // check against daily and total restrictions to determine if the transaction should pass or not
                    if (transactionAmount > newIR) {
                        console.log("\t\t Tx should fail");

                        await catchRevert (
                            I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1})
                        );

                        console.log("\t\t Tx failed as expected");
                    } else if (transactionAmount <= newIR) {

                        console.log("\t\t Tx should succeed");

                        await I_SecurityToken.transfer(account_investor3, web3.utils.toWei(transactionAmount.toString()), {from: account_investor1});

                        console.log("\t\t Tx succeeded");
                    }
                    await revertToSnapshot(snapId);
                    console.log("\t\t Finished test number "+j);
                };

                await I_VolumeRestrictionTM.removeIndividualRestriction(account_investor1, {from: token_owner});
                console.log("\t\t Removed daily restriction");
            }

        });

    });
    
});