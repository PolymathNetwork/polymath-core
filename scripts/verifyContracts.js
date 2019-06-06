// truffle run verify TokenLib --network kovan
//

const fs = require("fs");
const path = require("path");
const exec = require('child_process').execSync;

async function readFiles() {
    if (fs.existsSync("./build/contracts/")) {
        return fs.readdirSync("./build/contracts/");
    } else {
        console.log('Compiling contracts. This may take a while, please wait.');
        exec('truffle compile');
        return fs.readdirSync("./build/contracts/");
    }
}

async function verifyContracts() {
  let files = await readFiles();
  files.forEach(item => {
    console.log('Verifying', path.basename(item, ".json"));
    exec('truffle run verify ' + path.basename(item, ".json") + ' --network kovan');
  });
}

verifyContracts();
