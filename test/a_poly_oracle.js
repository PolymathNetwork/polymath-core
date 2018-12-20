const PolyOracle = artifacts.require("./MockPolyOracle.sol");
import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { increaseTime } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PolyOracle", async (accounts) => {
    let I_PolyOracle;
    let owner;
    const URL =
        '[URL] json(https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2496&convert=USD&CMC_PRO_API_KEY=${[decrypt] BBObnGOy63qVI3OR2+MX88dzSMVjQboiZc7Wluuh2ngkSgiX1csxWgbAFtu22jbrry42zwCS4IUmer1Wk+1o1XhF7hyspoGCkbufQqYwuUYwcA2slX6RbEDai7NgdkgNGWSwd6DcuN8jD5ZMTkX68rJKkplr}).data."2496".quote.USD.price';
    const alternateURL = "json(https://min-api.cryptocompare.com/data/price?fsym=POLY&tsyms=USD).USD";
    const SanityBounds = 20 * 10 ** 16;
    const GasLimit = 100000;
    const TimeTolerance = 5 * 60;
    const message = "Txn should fail";
    let latestPrice;
    let requestIds = new Array();

    before(async () => {
        owner = accounts[0];
        I_PolyOracle = await PolyOracle.new({ from: owner });
    });

    describe("state variables checks", async () => {
        it("should set and check the api url", async () => {
            await I_PolyOracle.setOracleURL(URL, { from: owner });
            let url = await I_PolyOracle.oracleURL.call();
            assert.equal(URL, url);
        });

        it("should check the sanity bounds", async () => {
            let sanityBounds = await I_PolyOracle.sanityBounds.call();
            assert.equal(SanityBounds, sanityBounds);
        });

        it("should check the gas limits", async () => {
            let gasLimit = await I_PolyOracle.gasLimit.call();
            assert.equal(GasLimit, gasLimit);
        });

        it("should check the oraclize time tolerance", async () => {
            let timeTolerance = await I_PolyOracle.oraclizeTimeTolerance.call();
            assert.equal(TimeTolerance, timeTolerance);
        });
    });

    describe("Scheduling test cases", async () => {
        it("Should schedule the timing of the call - fails - non owner", async () => {
            let timeScheduling = [
                await latestTime() + duration.minutes(1),
                await latestTime() + duration.minutes(2),
                await latestTime() + duration.minutes(3)
            ];
            await catchRevert(I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, { from: accounts[1], value: new BN(web3.utils.toWei("2")) }));
        });

        it("Should schedule the timing of the call - fails - no value", async () => {
            let timeScheduling = [
                await latestTime() + duration.minutes(1),
                await latestTime() + duration.minutes(2),
                await latestTime() + duration.minutes(3)
            ];
            await catchRevert(I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, { from: owner }));
        });

        it("Should schedule the timing of the call - single call", async () => {
            let blockNo = await latestBlock();
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed([], { from: owner, value: new BN(web3.utils.toWei("1")) });
            assert.isAtMost(tx.logs[0].args._time.toNumber(), await latestTime());
            // await increaseTime(50);
            const logNewPriceWatcher = (await I_PolyOracle.getPastEvents('PriceUpdated', {filter: {from: blockNo}}))[0];
            // const log = await logNewPriceWatcher;
            assert.equal(logNewPriceWatcher.event, "PriceUpdated", "PriceUpdated not emitted.");
            assert.isNotNull(logNewPriceWatcher.args._price, "Price returned was null.");
            assert.equal(logNewPriceWatcher.args._oldPrice.toNumber(), 0);
            console.log(
                "Success! Current price is: " +
                    logNewPriceWatcher.args._price.div(new BN(10).pow(new BN(18))).toNumber() +
                    " USD/POLY"
            );
        });

        it("Should schedule the timing of the call - multiple calls", async () => {
            let blockNo = await latestBlock();
            let timeScheduling = [await latestTime() + duration.seconds(10), await latestTime() + duration.seconds(20)];
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, { from: owner, value: new BN(web3.utils.toWei("1.5")) });

            let event_data = tx.logs;

            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), timeScheduling[i]);
            }

            // Wait for the callback to be invoked by oraclize and the event to be emitted
            const logNewPriceWatcher = (await I_PolyOracle.getPastEvents('PriceUpdated', {filter: {from: blockNo}}))[1];
            const log = await logNewPriceWatcher;
            assert.equal(log.event, "PriceUpdated", "PriceUpdated not emitted.");
            assert.isNotNull(log.args._price, "Price returned was null.");
            console.log("Success! Current price is: " + log.args._price.div(new BN(10).pow(new BN(18))).toNumber() + " USD/POLY");
        });

        it("Should schedule to call using iters - fails", async () => {
            await catchRevert(I_PolyOracle.schedulePriceUpdatesRolling(await latestTime() + 10, 30, 2, { from: accounts[6] }));
        });

        it("Should schedule to call using iters", async () => {
            let blockNo = await latestBlock();
            console.log(`Latest Block number of the local chain:${blockNo}`);
            let tx = await I_PolyOracle.schedulePriceUpdatesRolling(await latestTime() + 10, 10, 2, { from: owner });
            let event_data = tx.logs;
            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                requestIds.push(event_data[i].args._queryId);
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), await latestTime() + (i + 1) * 30);
            }
            // Wait for the callback to be invoked by oraclize and the event to be emitted
            const logNewPriceWatcher = (await I_PolyOracle.getPastEvents('PriceUpdated', {filter: {from: blockNo}}))[1];
            const log = await logNewPriceWatcher;
            assert.equal(log.event, "PriceUpdated", "PriceUpdated not emitted.");
            assert.isNotNull(log.args._price, "Price returned was null.");
            console.log("Success! Current price is: " + log.args._price.div(new BN(10).pow(new BN(18))).toNumber() + " USD/POLY");
            latestPrice = log.args._price;
        });
    });

    describe("Ownable functions", async () => {
        it("Should change the Poly USD price manually - fail - bad account", async () => {
            await catchRevert(I_PolyOracle.setPOLYUSD(latestPrice.add(1), { from: accounts[5] }));
        });

        it("Should change the Poly USD price manually", async () => {
            await I_PolyOracle.setPOLYUSD(latestPrice.add(1), { from: owner });
            let price2 = await I_PolyOracle.getPriceAndTime.call();
            assert.equal(price2[0].toNumber(), latestPrice.add(1).toNumber());
        });

        it("Should freeze the Oracle manually", async () => {
            await catchRevert(I_PolyOracle.setFreezeOracle(true, { from: accounts[5] }));
        });

        it("Should change the URL manually", async () => {
            let freeze_ = await I_PolyOracle.freezeOracle.call();
            await I_PolyOracle.setFreezeOracle(true, { from: owner });
            let freeze = await I_PolyOracle.freezeOracle.call();
            assert.isFalse(freeze_);
            assert.isTrue(freeze);
            await I_PolyOracle.setFreezeOracle(false, { from: owner });
        });

        it("Should change the sanity bounds manually - fails - bad owner", async () => {
            await catchRevert(I_PolyOracle.setSanityBounds(new BN(25).mul(new BN(10).pow(16)), { from: accounts[6] }));
        });

        it("Should change the sanity bounds manually", async () => {
            console.log(JSON.stringify(await I_PolyOracle.sanityBounds.call()));
            await I_PolyOracle.setSanityBounds(new BN(25).mul(new BN(10).pow(16)), { from: owner });
            let sanityBounds = await I_PolyOracle.sanityBounds.call();
            console.log(JSON.stringify(await I_PolyOracle.sanityBounds.call()));
            assert.equal(sanityBounds.toNumber(), new BN(25).mul(new BN(10).pow(16)).toNumber());
        });

        it("Should change the gas price manually - fails - bad owner", async () => {
            await catchRevert(I_PolyOracle.setGasPrice(new BN(60).mul(new BN(10).pow(9)), { from: accounts[6] }));
        });

        it("Should change the gas price manually", async () => {
            await I_PolyOracle.setGasPrice(new BN(60).mul(new BN(10).pow(9)), { from: owner });
            let blockNo = await latestBlock();
            let timeScheduling = [await latestTime() + duration.seconds(10), await latestTime() + duration.seconds(20)];
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, { from: owner, value: new BN(web3.utils.toWei("2")) });

            let event_data = tx.logs;

            for (var i = 0; i < event_data.length; i++) {
                let time = event_data[i].args._time;
                console.log(`       checking the time for the ${i} index and the scheduling time is ${time}`);
                assert.isAtMost(time.toNumber(), timeScheduling[i]);
            }
            const logNewPriceWatcher = (await I_PolyOracle.getPastEvents('PriceUpdated', {filter: {from: blockNo}}))[1];

            assert.equal(logNewPriceWatcher.event, "PriceUpdated", "PriceUpdated not emitted.");
            assert.isNotNull(logNewPriceWatcher.args._price, "Price returned was null.");
            console.log(
                "Success! Current price is: " +
                    logNewPriceWatcher.args._price.div(new BN(10).pow(new BN(18))).toNumber() +
                    " USD/POLY"
            );
            // assert.isTrue(false);
        });

        it("Should change the gas limit manually - fails", async () => {
            await catchRevert(I_PolyOracle.setGasLimit(50000, { from: accounts[6] }));
        });

        it("Should change the gas limit manually", async () => {
            await I_PolyOracle.setGasLimit(50000, { from: owner });
            let gasLimit = await I_PolyOracle.gasLimit.call();
            assert.equal(gasLimit.toNumber(), 50000);
            await I_PolyOracle.setGasLimit(100000, { from: owner });
        });

        it("Should blacklist some IDS manually - fails - wrong size", async () => {
            let ignore = [true];
            await catchRevert(I_PolyOracle.setIgnoreRequestIds(requestIds, ignore, { from: accounts[6] }));
        });

        it("Should blacklist some IDS manually", async () => {
            let ignore = [false, true];
            console.log(requestIds);
            await I_PolyOracle.setIgnoreRequestIds(requestIds, ignore, { from: owner });

            // let ignoreRequestId0 = await I_PolyOracle.ignoreRequestIds.call(requestIds[1]);
            // assert.equal(ignoreRequestId0,true);

            // let ignoreRequestId1 = await I_PolyOracle.ignoreRequestIds.call(requestIds[2]);
            // assert.equal(ignoreRequestId1,false);
        });

        it("Should change the oraclize time tolerance manually - fails", async () => {
            await catchRevert(I_PolyOracle.setOraclizeTimeTolerance(3600, { from: accounts[6] }));
        });

        it("Should change the oraclize time tolerance manually", async () => {
            await I_PolyOracle.setOraclizeTimeTolerance(3600, { from: owner });
            let oraclizeTimeTolerance = await I_PolyOracle.oraclizeTimeTolerance.call();
            assert.equal(oraclizeTimeTolerance.toNumber(), 3600);
        });

        it("should change the api URL manually", async () => {
            await catchRevert(I_PolyOracle.setOracleURL(alternateURL, { from: accounts[6] }));
        });

        it("should change the api URL manually", async () => {
            await I_PolyOracle.setOracleURL(alternateURL, { from: owner });
            await I_PolyOracle.setOracleQueryType("URL", { from: owner });
            let url = await I_PolyOracle.oracleURL.call();
            assert.equal(alternateURL, url);
        });

        it("Should schedule the timing of the call - after changes", async () => {
            let blockNo = await latestBlock();
            let tx = await I_PolyOracle.schedulePriceUpdatesFixed([], { from: owner, value: new BN(web3.utils.toWei("1")) });
            assert.isAtMost(tx.logs[0].args._time.toNumber(), await latestTime());
            const logNewPriceWatcher = (await I_PolyOracle.getPastEvents('PriceUpdated', {filter: {from: blockNo}}))[0];
            assert.equal(logNewPriceWatcher.event, "PriceUpdated", "PriceUpdated not emitted.");
            assert.isNotNull(logNewPriceWatcher.args._price, "Price returned was null.");
            console.log(
                "Success! Current price is: " +
                    logNewPriceWatcher.args._price.div(new BN(10).pow(new BN(18))).toNumber() +
                    " USD/POLY"
            );
            // assert.isTrue(false);
        });
    });

    describe("Get Functions call", async () => {
        it("Should get the currency address", async () => {
            let polyTokenAddress = await I_PolyOracle.getCurrencyAddress.call();
            assert.equal(polyTokenAddress, "0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC".toLowerCase());
        });

        it("Should get the currency symbol", async () => {
            let currency = await I_PolyOracle.getCurrencySymbol.call();
            assert.equal(web3.utils.toAscii(currency).replace(/\u0000/g, ""), "POLY");
        });

        it("Should get the currency denomination", async () => {
            let denomination = await I_PolyOracle.getCurrencyDenominated.call();
            assert.equal(web3.utils.toAscii(denomination).replace(/\u0000/g, ""), "USD");
        });
    });
});
