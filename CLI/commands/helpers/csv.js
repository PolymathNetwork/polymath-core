const csvParse = require('csv-parse/lib/sync');
const fs = require('fs');

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
  }
  return obj;
}

function parse(_csvFilePath, _batchSize) {
  // Read file
  let input = fs.readFileSync(_csvFilePath);
  // Parse csv
  let data = csvParse(input, { cast: _cast });
  // Batches
  let allBatches = [];
  for (let index = 0; index < data.length; index += _batchSize) {
    allBatches.push(data.slice(index, index + _batchSize));
  }
  // Transform result
  let result = [];
  let columnsLenght = data[0].length;
  for (let index = 0; index < columnsLenght; index++) {
    result[index] = allBatches.map(batch => batch.map(record => record[index]));
  }
  return result;
}

module.exports = parse;