const fs = require("fs");
const path = require("path");
const exec = require('child_process').execSync;

function walkSync(dir, filelist) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};


async function flatten_contract() {
    if (fs.existsSync("./flat")) {
        exec(`rm -rf ./flat`);
    }
    exec(`mkdir flat`);
    const fileList = walkSync("./contracts", []);
    fileList.forEach(item => {
        console.log('Flattening', path.basename(item));
        exec(`./node_modules/.bin/truffle-flattener ./${item} >> ./flat/${path.basename(item)}`);
    });

}


flatten_contract();