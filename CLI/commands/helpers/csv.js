const csvParse = require('csv-parse/lib/sync');
const fs = require('fs');
const web3Utils = require('web3-utils');

function _cast(obj) {
  if (/^(\-|\+)?([1-9]+[0-9]*)$/.test(obj)) { // Int
    obj = parseInt(obj);
  }
  else if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(obj)) { // Float
    obj = parseFloat(obj);
  }
  else if (/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.test(obj)) { // Datetime
    var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(obj);
    var composedDate = new Date(matches[3], matches[1] - 1, matches[2]);
    var timestampDate = composedDate.getTime();
    obj = timestampDate / 1000;
  }
  else if (obj.toLowerCase() === "true" || obj.toLowerCase() === "false") { // Boolean
    obj = JSON.parse(obj.toLowerCase());
  } else if (web3Utils.isAddress(obj)) {
    obj = web3Utils.toChecksumAddress(obj);
  }
  return obj;
}

function parse(_csvFilePath, _batchSize) {
  // Read file
  let input = fs.readFileSync(_csvFilePath);
  // Parse csv
  let data = csvParse(input, { cast: _cast });

  return data;
}

module.exports = parse;