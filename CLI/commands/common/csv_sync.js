var fs = require('fs');

function load(filename, options) {
  var content = fs.readFileSync(filename, 'utf-8');
  var lines = content.split('\n');
  var splitToColumns = options && check.fn(options.getColumns) ? options.getColumns : getColumns;
  var results = [];
  
  lines.forEach(function (line, index) {
    if (!line) {
      return;
    }

    var obj = [];
    var values = stripQuotes(splitToColumns(line, index));

    values.forEach(function (value) {
      obj.push(value)
    });

    results.push(obj);
  });

  return results;
}

function getColumns(line) {
  var columns = line.split(',');
  return columns;
}

function stripQuotes(words) {
  return words.map(function (word) {
    word = word.trim();
    return word.replace(/"/g, '');
  });
}

module.exports = load;
