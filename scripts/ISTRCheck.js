const fs = require('fs');
const exec = require('child_process').execSync;
const chalk = require('chalk');

// These functions/events are allowed to differ. (These are present in STR but not used and hence not defined in ISTR)
let exceptions = [
    "getBytes32Value",
    "getBytesValue",
    "getAddressValue",
    "getArrayAddress",
    "getBoolValue",
    "getStringValue",
    "getArrayBytes32",
    "getUintValue",
    "getArrayUint",
    "initialize",
    "getBytes32Value",
    "getBytesValue",
    "getAddressValue",
    "getArrayAddress",
    "getBoolValue",
    "getStringValue",
    "getArrayBytes32",
    "getUintValue",
    "getArrayUint",
    undefined, // constructor
];

async function readFiles() {
    if (!fs.existsSync("./build/contracts/ISecurityTokenRegistry.json")) {
        console.log(chalk.yellow('Compiling contracts. This may take a while, please wait.'));
        exec('./node_modules/.bin/truffle compile');
    }
    return([
        JSON.parse(fs.readFileSync(`./build/contracts/ISecurityTokenRegistry.json`).toString()).abi,
        [
            ...JSON.parse(fs.readFileSync(`./build/contracts/SecurityTokenRegistry.json`).toString()).abi,
            ...JSON.parse(fs.readFileSync(`./build/contracts/STRGetter.json`).toString()).abi
        ]
    ]);
}

async function checkISTR() {
    // Reading ABIs from build files
    let ABIs = await readFiles();

    // Removing functions/events defined in exceptions array.
    removeExceptions(ABIs);

    // Removing parameter and return names from ABIs as they can differ.
    // Only cleaning ABIs of second file as first one can be cleaned in the next loop efficiently.
    for (let i = 0; i < ABIs[1].length; i++) {
        cleanABI(ABIs[1][i]);
    }

    // This function removed duplicate elements from the ABI.
    // i.e If the signature matches in Interface and the contract, it is removed from the ABI.
    // This means that the left over elements after this loop are mistakes.
    for (let i = 0; i < ABIs[0].length; i++) {
        let fna = cleanABI(ABIs[0][i]);
        for (let j = 0; j < ABIs[1].length; j++) {
            let fnb = ABIs[1][j];
            if (fna.name == fnb.name && fna.type == fnb.type) {
                if (JSON.stringify(fna) === JSON.stringify(fnb)) {
                    ABIs[0].splice(i, 1);
                    ABIs[1].splice(j, 1);
                    i--;
                    break;
                }
            }
        }
    }

    // If there is any element remaining in either ABI, it is an error.
    if (ABIs[0].length >= 1 || ABIs[1].length > 1) {
        for (let i = 0; i < ABIs[0].length; i++) {
            console.log(ABIs[0][i].name);
        }
        for (let i = 0; i < ABIs[1].length; i++) {
            console.log(ABIs[1][i].name);
        }
        console.log(chalk.red('The above Functions/events had no match found. Please synchronize the Interface with the contract.'));
        process.exit(1);
    }
}

function cleanABI(element) {
    if (element.type === 'event') {
        for(let i = 0; i < element.inputs.length; i++) {
            element.inputs[i].name = "";
        }
    } else if (element.type === 'function') {
        for(let i = 0; i < element.inputs.length; i++) {
            element.inputs[i].name = "";
        }
        for(let i = 0; i < element.outputs.length; i++) {
            element.outputs[i].name = "";
        }
    }
    return element;
}

function removeExceptions(ABIs) {
    for (let i = 0; i < ABIs[0].length; i++) {
        if (exceptions.includes(ABIs[0][i].name)) {
            ABIs[0].splice(i, 1);
            i--;
        }
    }
    for (let i = 0; i < ABIs[1].length; i++) {
        if (exceptions.includes(ABIs[1][i].name)) {
            ABIs[1].splice(i, 1);
            i--;
        }
    }
}

checkISTR();
