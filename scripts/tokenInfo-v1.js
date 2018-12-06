const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));
var request = require('request-promise')

const securityTokenABI = JSON.parse(require('fs').readFileSync('../CLI/data/SecurityToken1-4-0.json').toString()).abi;
const generalTransferManagerABI = JSON.parse(require('fs').readFileSync('../CLI/data/GeneralTransferManager1-4-0.json').toString()).abi;

async function getTokens() {
    const securityTokenRegistryAddress = "0xEf58491224958d978fACF55D2120c55A24516B98";
    const securityTokenRegistryABI = await getABIfromEtherscan(securityTokenRegistryAddress);
    const securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);

    let logs = await getLogsFromEtherscan(securityTokenRegistry.options.address, web3.utils.hexToNumber('0x5C5C18'), 'latest', 'LogNewSecurityToken(string,address,address)');
    for (let i = 0; i < logs.length; i++) {
        let tokenAddress = '0x' + logs[i].topics[1].slice(26, 66)
        await getInfo(tokenAddress);
    }
}

async function getInfo(tokenAddress) {
    let token = new web3.eth.Contract(securityTokenABI, tokenAddress);
    console.log("Token - " + tokenAddress);
    console.log("----------------------");
    console.log("Owner: " + await token.methods.owner().call());
    console.log("Name: " + await token.methods.name().call());
    console.log("Symbol: " + await token.methods.symbol().call());
    console.log("Total Supply: " + await token.methods.totalSupply().call());
    console.log("Frozen: " + await token.methods.freeze().call());
    console.log("Investors: " + await token.methods.investorCount().call());
    console.log("Latest Checkpoint: " + await token.methods.currentCheckpointId().call());
    console.log("Finished Issuer Minting: " + await token.methods.finishedIssuerMinting().call());
    console.log("Finished STO Minting: " + await token.methods.finishedSTOMinting().call());
    let gtmRes = await token.methods.modules(2, 0).call();
    let gtmEvents = await getLogsFromEtherscan(gtmRes.moduleAddress, web3.utils.hexToNumber('0x5C5C18'), 'latest', 'LogModifyWhitelist(address,uint256,address,uint256,uint256,uint256,bool)');
    console.log("Count of GeneralTransferManager Events: " + gtmEvents.length);
    console.log("Modules Attached (TransferManager):");
    await getModules(2, token);
    console.log("Modules Attached (PermissionManager):");
    await getModules(1, token);
    console.log("Modules Attached (STO):");
    await getModules(3, token);
    console.log("Modules Attached (Checkpoint):");
    await getModules(4, token);
    console.log("")
    console.log();
    console.log();
}

async function getModules(type, token) {
    let index = 0;
    while (true) {
        try {
            let res = await token.methods.modules(type, index).call();
            console.log("   Name: " + web3.utils.toAscii(res.name));
            console.log("   Address: " + res.moduleAddress);
        } catch (err) {
            // console.log(err);
            if (index == 0) {
                console.log("   None");
            }
            return;
        }
        index = index + 1;
    }
}

async function getLogsFromEtherscan(_address, _fromBlock, _toBlock, _eventSignature) {
    let urlDomain = 'api';
    const options = {
        url: `https://${urlDomain}.etherscan.io/api`,
        qs: {
            module: 'logs',
            action: 'getLogs',
            fromBlock: _fromBlock,
            toBlock: _toBlock,
            address: _address,
            topic0: web3.utils.sha3(_eventSignature),
            apikey: 'THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559'
        },
        method: 'GET',
        json: true
    };
    let data = await request(options);
    return data.result;
}

async function getABIfromEtherscan(_address) {
    let urlDomain = 'api';
    const options = {
        url: `https://${urlDomain}.etherscan.io/api`,
        qs: {
            module: 'contract',
            action: 'getabi',
            address: _address,
            apikey: 'THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559'
        },
        method: 'GET',
        json: true
    };
    let data = await request(options);
    return JSON.parse(data.result);
}

getTokens();