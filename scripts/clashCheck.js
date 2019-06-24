const fs = require('fs');
const exec = require('child_process').execSync;
const chalk = require('chalk');
const Web3 = require('web3');

async function readFiles() {
    if (fs.existsSync("./build/contracts/")) {
        return fs.readdirSync("./build/contracts/");
    } else {
        console.log(chalk.yellow('Compiling contracts. This may take a while, please wait.'));
        exec('./node_modules/.bin/truffle compile');
        return fs.readdirSync("./build/contracts/");
    }
}

async function checkClashes() {
    console.log(chalk.green("Starting function selector clash check"));
    let files = await readFiles();
    let contractFunctions = new Set();
    let functionSelectors = new Map();
    files.forEach(item => {
        let ABI = JSON.parse(fs.readFileSync(`./build/contracts/${item}`).toString()).abi;
        ABI.forEach(element => {
            if (element['type'] == 'function') {
                let functionSig = element['name'] + '(';
                element['inputs'].forEach(input => {
                    functionSig = functionSig + input['type'] + ',';
                });
                if(functionSig[functionSig.length - 1] == ',')
                    functionSig = functionSig.slice(0, -1) + ')';
                else
                    functionSig = functionSig + ')';
                contractFunctions.add(functionSig);
            }
        });
    });
    let clashesFound = false;
    contractFunctions.forEach(functionSig => {
        let fnSelector = Web3.utils.sha3(functionSig).slice(0, 10);
        if(functionSelectors.has(fnSelector)) {
            clashesFound = true;
            console.log(chalk.red('Function selector clash found!', functionSelectors.get(fnSelector), 'and', functionSig, 'have the same function selector:', fnSelector));
            functionSelectors.set(fnSelector, functionSelectors.get(fnSelector) + ', ' + functionSig);
        } else {
            functionSelectors.set(fnSelector, functionSig);
        }
    });
    if (clashesFound) {
        console.log(chalk.yellow("The clash(es) might be in two different contracts and hence not be am Issue.\nThis script can not detect this (yet) because of proxy contracts"));
        console.log(chalk.red("Clash(es) found! Please fix."));
        process.exit(1);
    }
    console.log(chalk.green("Clash check finished. No Clashes found."));
}

checkClashes();
