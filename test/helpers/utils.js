/* global assert */

var _ = require("lodash");

function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function ensureException(error) {
    assert(isException(error), error.toString());
}

async function timeDifference(timestamp1,timestamp2) {
    var difference = timestamp1 - timestamp2;
    return difference;
}

function convertHex(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
      let char = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      if (char != '\u0000') str += char;
    }
    return str;
  }

export {
    ensureException,
    timeDifference,
    convertHex }

export const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
  };


/**
* Helper to wait for log emission.
* @param  {Object} _event The event to wait for.
*/
export function promisifyLogWatch(_event, _times) {
   return new Promise((resolve, reject) => {
     let i = 0;
     _event.watch((error, log) => {
       if (error !== null)
         reject(error);
       i = i + 1;
       console.log("Received event: " + i + " out of: " + _times);
       if (i == _times) {
         _event.stopWatching();
         resolve(log);
       }
     });
   });
 }

 export function latestBlock () {
    return web3.eth.getBlock('latest').number;
  }