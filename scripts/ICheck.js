const fs = require('fs');
const exec = require('child_process').execSync;
const chalk = require('chalk');

// These functions/events are allowed to differ. (These are present in STR/STRGetter but not used and hence not defined in ISTR)
let strExceptions = [
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

// These functions/events are allowed to differ. (These are present in ST/STGetter but not used and hence not defined in IST)
let stExceptions = [
    "_owner",
    "UNLOCKED",
    "LOCKED",
    undefined, // constructor
];

async function readFiles() {
    if (!fs.existsSync("./build/contracts/ISecurityTokenRegistry.json") || !fs.existsSync("./build/contracts/ISecurityToken.json")) {
        console.log(chalk.yellow('Compiling contracts. This may take a while, please wait.'));
        exec('./node_modules/.bin/truffle compile');
    }
    let strABIs = [
        JSON.parse(fs.readFileSync(`./build/contracts/ISecurityTokenRegistry.json`).toString()).abi,
        JSON.parse(fs.readFileSync(`./build/contracts/SecurityTokenRegistry.json`).toString()).abi,
        JSON.parse(fs.readFileSync(`./build/contracts/STRGetter.json`).toString()).abi
    ];
    let stABIs = [
        JSON.parse(fs.readFileSync(`./build/contracts/ISecurityToken.json`).toString()).abi,
        JSON.parse(fs.readFileSync(`./build/contracts/SecurityToken.json`).toString()).abi,
        JSON.parse(fs.readFileSync(`./build/contracts/STGetter.json`).toString()).abi
    ];
    return [strABIs, stABIs];
    }

async function checkInterfaces() {
    // Reading ABIs from build files
    let [strABIs, stABIs] = await readFiles();
    // Perform checks on the interface files
    let strMismatch = await interfaceCheck(strABIs, strExceptions, "ISecurityTokenRegistry");
    let stMismatch = await interfaceCheck(stABIs, stExceptions, "ISecurityToken");
    if (strMismatch || stMismatch) {process.exit(1)};
}

async function interfaceCheck(ABIs, exceptions, interfaceName) {
    // Removing functions/events defined in the exceptions arrays.
    removeExceptions(ABIs, exceptions);
    // Removing parameter and return names from ABIs as they can differ.
    // Only cleaning ABIs of third file as other files can be cleaned in the following loops efficiently.
    for (let i = 0; i < ABIs[2].length; i++) {
        cleanABI(ABIs[2][i]);
    }
    // Removing one instance of duplicates common to main contract and getter contract
    removeDuplicates(ABIs);
    // Combine second and third ABI after duplicates were removed
    ABIs = [ABIs[0],[...ABIs[1],...ABIs[2]]];

    // This function removes elements that match between the interface and contracts
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

    // If there is any element remaining in either ABI, it is an error and they should be reported.
    if (ABIs[0].length >= 1 || ABIs[1].length >= 1) {
        for (let i = 0; i < ABIs[0].length; i++) {
            console.log(ABIs[0][i].name);
        }
        for (let i = 0; i < ABIs[1].length; i++) {
            console.log(ABIs[1][i].name);
        }
        console.log(chalk.red('The above Functions/events had a mismatch with ' + interfaceName + '. Please synchronize the Interface with the contract.\n'));
        return true;
    }
    return false;
}

// This function removes parameter and return names from ABIs as they can differ.
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

// This function removes one instance of duplicates common to main contract and getter
function removeDuplicates(ABIs) {
    for (let i = 0; i < ABIs[1].length; i++) {
        let fna = cleanABI(ABIs[1][i]);
        for (let j = 0; j < ABIs[2].length; j++) {
            let fnb = ABIs[2][j];
            if (fna.name == fnb.name && fna.type == fnb.type) {
                if (JSON.stringify(fna) === JSON.stringify(fnb)) {
                    ABIs[1].splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }
}

// This function removes functions/events defined in an exceptions arrays.
function removeExceptions(ABIs, exceptions) {
    for (let i = 0; i < ABIs.length; i++) {
        for (let j = 0; j < ABIs[i].length; j++) {
            if (exceptions.includes(ABIs[i][j].name)) {
                ABIs[i].splice(j, 1);
                j--;
            }
        }
    }
}

checkInterfaces();
