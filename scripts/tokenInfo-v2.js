const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));
var request = require("request-promise");

const securityTokenABI = JSON.parse(
    require("fs")
        .readFileSync("../build/contracts/SecurityToken.json")
        .toString()
).abi;
const generalTransferManagerABI = JSON.parse(
    require("fs")
        .readFileSync("../build/contracts/GeneralTransferManager.json")
        .toString()
).abi;

async function getTokens() {
    const securityTokenRegistryAddress = "0x240f9f86b1465bf1b8eb29bc88cbf65573dfdd97";
    const securityTokenRegistryABI = await getABIfromEtherscan(securityTokenRegistryAddress);
    const securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);

    let logs = await getLogsFromEtherscan(
        securityTokenRegistry.options.address,
        0,
        "latest",
        "NewSecurityToken(string,string,address,address,uint256,address,bool,uint256)"
    );
    console.log(logs.length);
    for (let i = 0; i < logs.length; i++) {
        let tokenAddress = "0x" + logs[i].topics[1].slice(26, 66);
        await getInfo(tokenAddress);
    }
}

async function getInfo(tokenAddress) {
    let token = new web3.eth.Contract(securityTokenABI, tokenAddress);
    console.log("Token - " + tokenAddress);
    console.log("----------------------");
    //console.log("Owner: " + await token.methods.owner().call());
    console.log("Name: " + (await token.methods.name().call()));
    console.log("Details: " + (await token.methods.tokenDetails().call()));
    console.log("Symbol: " + (await token.methods.symbol().call()));
    console.log("Granularity: " + (await token.methods.granularity().call()));
    console.log("Total Supply: " + (await token.methods.totalSupply().call()));
    console.log("Transfers Frozen: " + (await token.methods.transfersFrozen().call()));
    console.log("Minting Frozen: " + (await token.methods.mintingFrozen().call()));
    let controllerDisabled = await token.methods.controllerDisabled().call();
    if (controllerDisabled) {
        console.log("Controller disabled: YES");
    } else {
        console.log("Controller: " + (await token.methods.controller().call()));
    }
    console.log("Investors: " + (await token.methods.getInvestorCount().call()));
    console.log("Latest Checkpoint: " + (await token.methods.currentCheckpointId().call()));
    let gtmEventsCount = 0;
    let gtmModules = await token.methods.getModulesByName(web3.utils.toHex("GeneralTransferManager")).call();
    for (const m of gtmModules) {
        let gtmEvents = await getLogsFromEtherscan(
            m,
            9299699,
            "latest",
            "ModifyWhitelist(address,uint256,address,uint256,uint256,uint256,bool)"
        );
        gtmEventsCount += gtmEvents.length;
    }
    console.log("Count of GeneralTransferManager Events: " + gtmEventsCount);
    console.log("Modules Attached (TransferManager):");
    await getModules(2, token);
    console.log("Modules Attached (PermissionManager):");
    await getModules(1, token);
    console.log("Modules Attached (STO):");
    await getModules(3, token);
    console.log("Modules Attached (Checkpoint):");
    await getModules(4, token);
    console.log("Modules Attached (Burn):");
    await getModules(5, token);
    console.log();
    console.log();
}

async function getModules(type, token) {
    let modules = await token.methods.getModulesByType(type).call();
    for (const m of modules) {
        let moduleData = await token.methods.getModule(m).call();
        console.log("   Name: " + web3.utils.toAscii(moduleData[0]));
        console.log("   Address: " + m);
    }
}

async function getLogsFromEtherscan(_address, _fromBlock, _toBlock, _eventSignature) {
    let urlDomain = "api";
    const options = {
        url: `https://${urlDomain}.etherscan.io/api`,
        qs: {
            module: "logs",
            action: "getLogs",
            fromBlock: _fromBlock,
            toBlock: _toBlock,
            address: _address,
            topic0: web3.utils.sha3(_eventSignature),
            apikey: "THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559"
        },
        method: "GET",
        json: true
    };
    let data = await request(options);
    return data.result;
}

async function getABIfromEtherscan(_address) {
    let urlDomain = "api";
    const options = {
        url: `https://${urlDomain}.etherscan.io/api`,
        qs: {
            module: "contract",
            action: "getabi",
            address: _address,
            apikey: "THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559"
        },
        method: "GET",
        json: true
    };
    let data = await request(options);
    return JSON.parse(data.result);
}

getTokens();
