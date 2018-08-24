const PolyOracle = artifacts.require('./MockPolyOracle.sol');
import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import {increaseTime} from './helpers/time';

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('PolyOracle', accounts=> {

let I_PolyOracle;
let owner;
const URL = '[URL] json(https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2496&convert=USD&CMC_PRO_API_KEY=${[decrypt] BBObnGOy63qVI3OR2+MX88dzSMVjQboiZc7Wluuh2ngkSgiX1csxWgbAFtu22jbrry42zwCS4IUmer1Wk+1o1XhF7hyspoGCkbufQqYwuUYwcA2slX6RbEDai7NgdkgNGWSwd6DcuN8jD5ZMTkX68rJKkplr}).data."2496".quote.USD.price';
const alternateURL = "json(https://min-api.cryptocompare.com/data/price?fsym=POLY&tsyms=USD).USD";
const SanityBounds = 20*10**16;
const GasLimit = 100000;
const TimeTolerance = 5*60;
const message = "Txn should fail";
let latestPrice;
let requestIds = new Array();

    before(async()=> {
        owner = accounts[0];
        I_PolyOracle = await PolyOracle.new({from : owner});
    });


    describe("state variables checks", async() => {

        it("should set and check the api url", async() => {
            await I_PolyOracle.setOracleURL(URL, {from: owner});
            let url = await I_PolyOracle.oracleURL.call();
            assert.equal(URL, url);
        });

        it("should check the sanity bounds", async() => {
            let sanityBounds = await I_PolyOracle.sanityBounds.call();
            assert.equal(SanityBounds, sanityBounds);
        });

        it("should check the gas limits", async() => {
            let gasLimit = await I_PolyOracle.gasLimit.call();
            assert.equal(GasLimit, gasLimit);
        });

        it("should check the oraclize time tolerance", async() => {
            let timeTolerance = await I_PolyOracle.oraclizeTimeTolerance.call();
            assert.equal(TimeTolerance, timeTolerance);
        });

    })

    describe("Scheduling test cases", async() => {

        it("Should schedule the timing of the call - fails - non owner", async() => {
            let errorThrown = false;
            let timeScheduling = [latestTime()+duration.minutes(1), latestTime()+duration.minutes(2), latestTime()+duration.minutes(3)]
            try {
                await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: accounts[1], value: web3.utils.toWei("2")});
            } catch(error) {
                errorThrown = true;
                ensureException(error);
                console.log(`       tx -> revert msg.sender should be the owner of the contract`.grey);
            }
            assert.ok(errorThrown, message);
        });

        it("Should schedule the timing of the call - fails - no value", async() => {
            let errorThrown = false;
            let timeScheduling = [latestTime()+duration.minutes(1), latestTime()+duration.minutes(2), latestTime()+duration.minutes(3)]
            try {
                await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: owner});
            } catch(error) {
                errorThrown = true;
                ensureException(error);
                console.log(`       tx -> revert Because value for txn is not provided`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("Should schedule the timing of the call - single call", async() => {
            let blockNo = latestBlock();
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed([],{from: owner, value:web3.utils.toWei("1")});
            assert.isAtMost(tx.logs[0].args._time.toNumber(), latestTime());
            // await increaseTime(50);
            const logNewPriceWatcher = await promisifyLogWatch(I_PolyOracle.LogPriceUpdated({ fromBlock: blockNo }), 1);
            // const log = await logNewPriceWatcher;
            assert.equal(logNewPriceWatcher.event, 'LogPriceUpdated', 'LogPriceUpdated not emitted.')
            assert.isNotNull(logNewPriceWatcher.args._price, 'Price returned was null.')
            assert.equal(logNewPriceWatcher.args._oldPrice.toNumber(), 0);
            console.log('Success! Current price is: ' + logNewPriceWatcher.args._price.dividedBy(new BigNumber(10).pow(18)).toNumber() + ' USD/POLY')

        });

        it("Should schedule the timing of the call - multiple calls", async() => {
            let blockNo = latestBlock();
            let timeScheduling = [latestTime()+duration.seconds(10), latestTime()+duration.seconds(20)]
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: owner, value:web3.utils.toWei("1.5")});

            let event_data = tx.logs;

            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), timeScheduling[i]);
            }

            // Wait for the callback to be invoked by oraclize and the event to be emitted
            const logNewPriceWatcher = promisifyLogWatch(I_PolyOracle.LogPriceUpdated({ fromBlock: blockNo }), 2);
            const log = await logNewPriceWatcher;
            assert.equal(log.event, 'LogPriceUpdated', 'LogPriceUpdated not emitted.')
            assert.isNotNull(log.args._price, 'Price returned was null.');
            console.log('Success! Current price is: ' + log.args._price.dividedBy(new BigNumber(10).pow(18)).toNumber() + ' USD/POLY')
        });

        it("Should schedule to call using iters - fails", async() => {
            let errorThrown = false;
            try {
                await I_PolyOracle.schedulePriceUpdatesRolling(latestTime() + 10, 30, 2, {from: accounts[6]});
            } catch(error) {
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("Should schedule to call using iters", async() => {
            let blockNo = latestBlock();
            console.log(`Latest Block number of the local chain:${blockNo}`);
            let tx = await I_PolyOracle.schedulePriceUpdatesRolling(latestTime() + 10, 10, 2, {from: owner});
            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                requestIds.push(event_data[i].args._queryId);
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), latestTime() + ((i + 1) * 30));
            }
            // Wait for the callback to be invoked by oraclize and the event to be emitted
            const logNewPriceWatcher = promisifyLogWatch(I_PolyOracle.LogPriceUpdated({ fromBlock: blockNo }), 2);
            const log = await logNewPriceWatcher;
            assert.equal(log.event, 'LogPriceUpdated', 'LogPriceUpdated not emitted.')
            assert.isNotNull(log.args._price, 'Price returned was null.')
            console.log('Success! Current price is: ' + log.args._price.dividedBy(new BigNumber(10).pow(18)).toNumber() + ' USD/POLY');
            latestPrice = log.args._price;
        });
    })

    describe("Ownable functions", async() => {

        it("Should change the Poly USD price manually - fail - bad account", async() => {
            let errorThrown = false;
            try {
                await I_PolyOracle.setPOLYUSD(latestPrice.add(1), {from: accounts[5]});
            } catch(error) {
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the Poly USD price manually", async() => {
            await I_PolyOracle.setPOLYUSD(latestPrice.add(1), {from: owner});
            let price2 = await I_PolyOracle.getPriceAndTime.call();
            assert.equal(price2[0].toNumber(), latestPrice.add(1).toNumber());
        })

        it("Should freeze the Oracle manually", async() => {
            let errorThrown = false;
            try {
                await I_PolyOracle.setFreezeOracle(true, {from: accounts[5]});
            } catch(error) {
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("Should change the URL manually", async() => {
            let freeze_ = await I_PolyOracle.freezeOracle.call();
            await I_PolyOracle.setFreezeOracle(true, {from: owner});
            let freeze = await I_PolyOracle.freezeOracle.call();
            assert.isFalse(freeze_);
            assert.isTrue(freeze);
            await I_PolyOracle.setFreezeOracle(false, {from: owner});
        })

        it("Should change the sanity bounds manually - fails - bad owner", async() => {
            let errorThrown = false;
            try {
                await I_PolyOracle.setSanityBounds(new BigNumber(25).times(new BigNumber(10).pow(16)), {from : accounts[6]});
            } catch(error) {
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("Should change the sanity bounds manually", async() => {
            console.log(JSON.stringify(await I_PolyOracle.sanityBounds.call()));
            await I_PolyOracle.setSanityBounds(new BigNumber(25).times(new BigNumber(10).pow(16)), {from : owner});
            let sanityBounds = await I_PolyOracle.sanityBounds.call();
            console.log(JSON.stringify(await I_PolyOracle.sanityBounds.call()));
            assert.equal(sanityBounds.toNumber(), new BigNumber(25).times(new BigNumber(10).pow(16)).toNumber())
        });

        it("Should change the gas price manually - fails - bad owner", async() => {
            let errorThrown = false;
            try{
                await I_PolyOracle.setGasPrice(new BigNumber(60).times(new BigNumber(10).pow(9)),{from : accounts[6]});
            } catch(error){
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the gas price manually", async() => {
            await I_PolyOracle.setGasPrice(new BigNumber(60).times(new BigNumber(10).pow(9)),{from : owner});
            let blockNo = latestBlock();
            let timeScheduling = [latestTime()+duration.seconds(10), latestTime()+duration.seconds(20)];
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: owner, value:web3.utils.toWei("2")});

            let event_data = tx.logs;

            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), timeScheduling[i]);
            }

            const logNewPriceWatcher = await promisifyLogWatch(I_PolyOracle.LogPriceUpdated({ fromBlock: blockNo }), 2);

            assert.equal(logNewPriceWatcher.event, 'LogPriceUpdated', 'LogPriceUpdated not emitted.')
            assert.isNotNull(logNewPriceWatcher.args._price, 'Price returned was null.')
            console.log('Success! Current price is: ' + logNewPriceWatcher.args._price.dividedBy(new BigNumber(10).pow(18)).toNumber() + ' USD/POLY');
            // assert.isTrue(false);

        });

        it("Should change the gas limit manually - fails", async() => {
            let errorThrown = false;
            try{
                await I_PolyOracle.setGasLimit(50000,{from : accounts[6]});
            } catch(error){
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not owner`.grey);
            }
            assert.ok(errorThrown, message);
        });

        it("Should change the gas limit manually", async() => {
            await I_PolyOracle.setGasLimit(50000,{from : owner});
            let gasLimit = await I_PolyOracle.gasLimit.call();
            assert.equal(gasLimit.toNumber(),50000);
            await I_PolyOracle.setGasLimit(100000,{from : owner});
        });

        it("Should blacklist some IDS manually - fails - wrong size", async() => {
            let errorThrown = false;
            let ignore = [true];
            try{
                await I_PolyOracle.setIgnoreRequestIds(requestIds,ignore,{from : accounts[6]});
            } catch(error){
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not owner`.grey);
            }
        });

        it("Should blacklist some IDS manually", async() => {
            let ignore = [false, true];
            console.log(requestIds);
            await I_PolyOracle.setIgnoreRequestIds(requestIds, ignore, {from : owner});

            // let ignoreRequestId0 = await I_PolyOracle.ignoreRequestIds.call(requestIds[1]);
            // assert.equal(ignoreRequestId0,true);

            // let ignoreRequestId1 = await I_PolyOracle.ignoreRequestIds.call(requestIds[2]);
            // assert.equal(ignoreRequestId1,false);

        });

        it("Should change the oraclize time tolerance manually - fails", async() => {
            let errorThrown = false;
            try{
                await I_PolyOracle.setOraclizeTimeTolerance(3600,{from : accounts[6]});
            } catch(error){
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("Should change the oraclize time tolerance manually", async() => {
            await I_PolyOracle.setOraclizeTimeTolerance(3600,{from : owner});
            let oraclizeTimeTolerance = await I_PolyOracle.oraclizeTimeTolerance.call();
            assert.equal(oraclizeTimeTolerance.toNumber(),3600);
        });

        it("should change the api URL manually", async() => {
            let errorThrown = false;
            try {
                await I_PolyOracle.setOracleURL(alternateURL, {from: accounts[6]});
            } catch(error){
                errorThrown = true;
                console.log(`       tx->revert msg.sender is not the owner`.grey);
            }
            assert.ok(errorThrown, message);
        })

        it("should change the api URL manually", async() => {
            await I_PolyOracle.setOracleURL(alternateURL, {from: owner});
            await I_PolyOracle.setOracleQueryType("URL", {from: owner});
            let url = await I_PolyOracle.oracleURL.call();
            assert.equal(alternateURL, url);
        });

        it("Should schedule the timing of the call - after changes", async() => {
            let blockNo = latestBlock();
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed([],{from: owner, value:web3.utils.toWei("1")});
            assert.isAtMost(tx.logs[0].args._time.toNumber(), latestTime());
            const logNewPriceWatcher = await promisifyLogWatch(I_PolyOracle.LogPriceUpdated({ fromBlock: blockNo }), 1);
            assert.equal(logNewPriceWatcher.event, 'LogPriceUpdated', 'LogPriceUpdated not emitted.')
            assert.isNotNull(logNewPriceWatcher.args._price, 'Price returned was null.')
            console.log('Success! Current price is: ' + logNewPriceWatcher.args._price.dividedBy(new BigNumber(10).pow(18)).toNumber() + ' USD/POLY');
            // assert.isTrue(false);
        });

    })

    describe("Get Functions call", async() => {
        it("Should get the currency address", async() => {
            let polyTokenAddress = await I_PolyOracle.getCurrencyAddress.call();
            assert.equal(polyTokenAddress, ("0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC").toLowerCase());
        });

        it("Should get the currency symbol", async() => {
            let currency = await I_PolyOracle.getCurrencySymbol.call();
            assert.equal(web3.utils.toAscii(currency).replace(/\u0000/g, ''), "POLY");
        });

        it("Should get the currency denomination", async() => {
            let denomination = await I_PolyOracle.getCurrencyDenominated.call();
            assert.equal(web3.utils.toAscii(denomination).replace(/\u0000/g, ''), "USD");
        })

    })

})
