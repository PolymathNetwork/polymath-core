const fs = require("fs");
const path = require("path");
const exec = require('child_process').execSync;
const chalk = require('chalk');
const { table }  = require("table");

async function readFiles() {
    if (fs.existsSync("./build/contracts/")) {
        return fs.readdirSync("./build/contracts/");
    } else {
        console.log('Compiling contracts. This may take a while, please wait.');
        exec('./node_modules/.bin/truffle compile');
        return fs.readdirSync("./build/contracts/");
    }
}

async function printSize() {
    let files = await readFiles();
    console.log(`NOTE- Maximum size of contracts allowed to deloyed on the Ethereum mainnet is 24 KB(EIP170)`);
    console.log(`---- Size of the contracts ----`);
    let dataTable = [['Contracts', 'Size in KB']];
    files.forEach(item => {
        let content = JSON.parse(fs.readFileSync(`./build/contracts/${item}`).toString()).deployedBytecode;
        let sizeInKB = content.toString().length / 2 / 1024;
        if (sizeInKB > 24)
            dataTable.push([chalk.red(path.basename(item, ".json")),chalk.red(sizeInKB)]);
        else if (sizeInKB > 20)
            dataTable.push([chalk.yellow(path.basename(item, ".json")),chalk.yellow(sizeInKB)]);
        else
            dataTable.push([chalk.green(path.basename(item, ".json")),chalk.green(sizeInKB)]);
    });
    console.log(table(dataTable));
}

printSize();
