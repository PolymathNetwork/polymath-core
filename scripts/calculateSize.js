const fs = require("fs");
const path = require("path");
const exec = require('child_process').execSync;
const chalk = require('chalk');

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
    files.forEach(item => {
        let content = JSON.parse(fs.readFileSync(`./build/contracts/${item}`).toString()).deployedBytecode;
        let sizeInKB = content.toString().length / 2 / 1024;
        if (sizeInKB > 24)
            console.log(chalk.red(`${path.basename(item, ".json")} -  ${sizeInKB} KB`));
        else if (sizeInKB > 20)
            console.log(chalk.yellow(`${path.basename(item, ".json")} -  ${sizeInKB} KB`));
        else
            console.log(chalk.green(`${path.basename(item, ".json")} -  ${sizeInKB} KB`));
    });
}

printSize();
