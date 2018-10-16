const fs = require('fs');
const request = require('request');
const regex = /..\/n(.)*,/gmi;

request('https://raw.githubusercontent.com/maxsam4/solidity-coverage/relative-path/lib/app.js').pipe(fs.createWriteStream('node_modules\\solidity-coverage\\lib\\app.js'));

fs.readFile('.solcover.js', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  
  let testCommand = '..\\\\node_modules\\\\.bin\\\\truffle.cmd test --network coverage';
  fs.readdirSync('./test').forEach(file => {
    if(file != 'a_poly_oracle.js' && file != 's_v130_to_v140_upgrade.js')
      testCommand = testCommand + ' ' + file;
  });
  testCommand = testCommand + '\',';

  var result = data.replace(regex, testCommand);

  fs.writeFile('.solcover.js', result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});