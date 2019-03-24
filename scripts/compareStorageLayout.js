const fs = require("fs");
const _ = require("underscore");
const solc = require("solc");
const prompt = require("prompt");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

console.log(`Mandatory: Solc cli tool should be installed globally. Please put the contract name only`);
prompt.start();

prompt.get(["LogicContract", "ProxyContract"], async (err, result) => {
    let temp;
    let logicFilePath;
    let proxyFilePath; 

    const fileList = walkSync("./contracts", []);

    let paths = findPath(result.LogicContract, result.ProxyContract, fileList);

    if (paths.length == 2) {
        console.log("Contracts exists \n");

        await flatContracts(paths);
        let temp;
        let logicFilePath = `./flat/${path.basename(paths[0])}`;
        let proxyFilePath = `./flat/${path.basename(paths[1])}`;
        
        if (path.basename(paths[0]) === result.LogicContract) {
            temp = logicFilePath;
            logicFilePath = proxyFilePath;
            proxyFilePath = temp;
        }

        let logicAST = await getAST(logicFilePath);
        let proxyAST = await getAST(proxyFilePath);
        // Deleting the temp folder (no longer required)
        await flushTemp();

        console.log(compareStorageLayouts(parseContract(logicAST), parseContract(proxyAST)));
    } else {
        console.log("Contracts doesn't exists");
    }
});

function traverseAST(_input, _elements) {
    if (_input.children) {
        for (var i = 0; i < _input.children.length; i++) {
            traverseAST(_input.children[i], _elements);
        }
    }
    _elements.push(_input);
}

function compareStorageLayouts(logicLayout, proxyLayout) {
    function makeComp(x) {
        return [x.constant, x.name, x.stateVariable, x.storageLocation, x.type, x.value, x.visibility].join(":");
    }
    // if(newLayout.length < oldLayout.length) return false;
    for (var i = 0; i < logicLayout.length; i++) {
        const a = logicLayout[i].attributes;
        const comp1 = makeComp(a);
        console.log(comp1);
        const b = proxyLayout[i].attributes;
        const comp2 = makeComp(b);
        console.log(comp2);
        if (comp1 != comp2) {
            return false;
        }
    }
    return true;
}

function parseContract(input) {

    const elements = [];
    const AST = input;
    traverseAST(AST, elements);
    // console.log(elements);

    // filter out all Contract Definitions
    const contractDefinitions = _.filter(elements, (e, i) => e.name == "ContractDefinition");

    // filter out all linearizedBaseContracts
    // pick the last one as the last contract always has the full inheritance
    const linearizedBaseContracts = _.last(_.map(contractDefinitions, e => e.attributes.linearizedBaseContracts));

    // get all stateVariables
    const stateVariables = _.filter(elements, e => e.attributes && e.attributes.stateVariable);

    // group them by scope
    const stateVariableMap = _.groupBy(stateVariables, e => e.attributes.scope);

    orderedStateVariables = _.reduceRight(
        linearizedBaseContracts,
        (a, b) => {
            return a.concat(stateVariableMap[b] || []);
        },
        []
    );
    return orderedStateVariables;
}

var walkSync = function(dir, filelist) {
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

var findPath = function(logicContractName, proxyContractName, fileList) {
    let paths = new Array();
    for (let i = 0; i < fileList.length; i++) {
        if (
            logicContractName === path.basename(fileList[i]) ||
            logicContractName === path.basename(fileList[i]).split(".")[0] ||
            (proxyContractName === path.basename(fileList[i]) || proxyContractName === path.basename(fileList[i]).split(".")[0])
        ) {
            paths.push(fileList[i]);
        }
    }
    return paths;
};

async function flatContracts(_paths, _logic) {
    let promises = new Array();
    for (let i = 0; i < _paths.length; i++) {
        promises.push(await exec(`./node_modules/.bin/sol-merger ${_paths[i]} ./flat`));
    }
    await Promise.all(promises);
}

async function getAST(_filePath) {
    await exec(`solc -o temp --ast-json ${_filePath}`, {maxBuffer: 1024 * 1000});
    return JSON.parse(fs.readFileSync(`./temp/${path.basename(_filePath)}_json.ast`, "utf8").toString());
}

async function flushTemp() {
    await exec(`rm -rf temp`);
}