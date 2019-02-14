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
        exec('truffle compile');
        return fs.readdirSync("./build/contracts/");
    }
}

async function printSize() {
    let files = await readFiles();
    console.log(`NOTE- Maximum size of contracts allowed to deloyed on the Ethereum mainnet is 24 KB(EIP170)`);
    console.log(`---- Size of the contracts ----`);
    let contracts = new Array();
    let size = new Array();
    files.forEach(item => {
        let content = JSON.parse(fs.readFileSync(`./build/contracts/${item}`).toString()).deployedBytecode;
        let sizeInKB = content.toString().length / 2 / 1024;
        size.push(sizeInKB);
        if (sizeInKB > 24)
            contracts.push(chalk.red(path.basename(item, ".json")));
        else if (sizeInKB > 20)
            contracts.push(chalk.yellow(path.basename(item, ".json")));
        else
            contracts.push(chalk.green(path.basename(item, ".json")));
    });
    let dataTable = [['Contracts', 'Size in KB']];
    for (let i = 0; i < contracts.length; i++) {
        dataTable.push([
            contracts[i],
            size[i]
        ]);
    }
    console.log(table(dataTable));
}

printSize();
