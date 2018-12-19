const fs = require("fs");
const path = require("path");
var size = new Array();

function readFiles() {
    if (fs.existsSync("./build/contracts/")) {
        let files = fs.readdirSync("./build/contracts/");
        return files;
    } else {
        console.log("Directory doesn't exists");
    }
}

async function printSize() {
    let files = readFiles();
    files.forEach(item => {
        let content = JSON.parse(fs.readFileSync(`./build/contracts/${item}`).toString()).deployedBytecode;
        let sizeInKB = content.toString().length / 2 / 1024;
        size.push(sizeInKB);
    });
    console.log(`NOTE- Maximum size of contracts allowed to deloyed on the Ethereum mainnet is 24 KB(EIP170)`);
    console.log(`---- Size of the contracts ----`);
    for (let i = 0; i < files.length; i++) {
        console.log(`${path.basename(files[i], ".json")} -  ${size[i]} KB`);
    }
}

printSize();
