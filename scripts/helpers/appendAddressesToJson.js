const csv = require('fast-csv');
const editJsonFile = require("edit-json-file");
const exec = require('child_process').execSync;

csv
  .parseFile('./scripts/migrations-addresses.csv')
  .on('error', error => console.error(error))
  .on('data', row => addToJson(row[0], row[1]))
  .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));

function addToJson(name, address) {

  //Reload it from the disk
  file = editJsonFile('./build/contracts/' + name + '.json', {
   autosave: true
  });
  file.set("networks.5.address", address);
}