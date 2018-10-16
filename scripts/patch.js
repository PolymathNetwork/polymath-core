const fs = require('fs');
const request = require('request');
request('https://raw.githubusercontent.com/maxsam4/solidity-coverage/relative-path/lib/app.js').pipe(fs.createWriteStream('node_modules\\solidity-coverage\\lib\\app.js'));