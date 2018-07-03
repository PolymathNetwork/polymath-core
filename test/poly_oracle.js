const PolyOracle = artifacts.require('./PolyOracle.sol');
import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('PolyOracle', accounts=> {

let I_PolyOracle;
let owner;
const URL = "json(https://api.coinmarketcap.com/v2/ticker/2496/?convert=USD).data.quotes.USD.price";
const SanityBounds = 20*10**16;
const GasLimit = 100000;
const TimeTolerance = 5*60;
const message = "Txn should fail";

    before(async()=> {
        owner = accounts[0];
        I_PolyOracle = await PolyOracle.new({from : owner});
    });


    describe("state variables checks", async() => {
        
        it("should check the api url", async() => {
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

        it("Should schedule the timing of the call", async() => {
            let errorThrown = false;
            let timeScheduling = [latestTime()+duration.minutes(1), latestTime()+duration.minutes(2), latestTime()+duration.minutes(3)]
            try {
                await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: accounts[1], value: web3.utils.toWei("2")});
            } catch(error) {
                errorThrown = true;
                ensureException(error);
                console.log(`       tx -> revert msg.sender should be the owner of the contract`.grey);
            }
            assert.ok(message, errorThrown);
        });

        it("Should schedule the timing of the call", async() => {
            let errorThrown = false;
            let timeScheduling = [latestTime()+duration.minutes(1), latestTime()+duration.minutes(2), latestTime()+duration.minutes(3)]
            try {
                await I_PolyOracle.schedulePriceUpdatesFixed(timeScheduling, {from: owner});
            } catch(error) {
                errorThrown = true;
                ensureException(error);
                console.log(`       tx -> revert Because value for txn is not provided`.grey);
            }
            assert.ok(message, errorThrown);
        })

        it("Should schedule the timing of the call", async() => {
            await I_PolyOracle.schedulePriceUpdatesFixed([],{from: owner, value:web3.utils.toWei("1")});
            const LogNewOraclizeQuery = await I_PolyOracle.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogNewOraclizeQuery.watch(function(error, log){ resolve(log);});
            });

            assert.isAtMost(log.args._time, latestTime());

            const LogPriceUpdated = await I_PolyOracle.allEvents();
            const log1 = await new Promise(function(resolve, reject) {
                LogPriceUpdated.watch(function(error, log1){ resolve(log1);});
            });

            console.log(log1.args);
        })



    })

})