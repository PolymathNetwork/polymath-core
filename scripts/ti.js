require('dotenv').config();
const Web3 = require("web3");
const fs = require("fs");
const request = require('request-promise')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MAINNET_ENDPOINT)); //Mainnet
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.KOVAN_ENDPOINT)); //Kovan

const securityToken2ABI = JSON.parse(require('fs').readFileSync('./scripts/ABI.json').toString()).securityToken2ABI;
const securityToken3ABI = JSON.parse(require('fs').readFileSync('./scripts/ABI.json').toString()).securityToken3ABI;
let securityTokenRegistryAddress;
let urlDomain;
let token2Addresses = [];
let token3Addresses = [];

async function getTokens() {
    console.log("Fetching number of tokens, please wait.");
    let logs2 = await getLogsFromEtherscan(securityTokenRegistryAddress, 0, 'latest', 'NewSecurityToken(string,string,address,address,uint256,address,bool,uint256)');
    let logs3 = await getLogsFromEtherscan(securityTokenRegistryAddress, 0, 'latest', 'NewSecurityToken(string,string,address,address,uint256,address,bool,uint256,uint256,uint256)');
    console.log("Number of 2.0 tokens:", logs2.length);
    console.log("Number of 3.0 tokens:", logs3.length);
    console.log("Number of total tokens:", logs2.length + logs3.length);
    for (let i = 0; i < logs2.length; i++) {
        let tokenAddress = '0x' + logs2[i].topics[1].slice(26, 66);
        token2Addresses.push(tokenAddress);
    }
    for (let i = 0; i < logs3.length; i++) {
        let tokenAddress = '0x' + logs3[i].topics[1].slice(26, 66);
        token3Addresses.push(tokenAddress);
    }
    await getInfo();
}

async function getInfo() {
    console.log("Fetching token data, please wait.");
    console.time("Time taken to fetch info from the rpc node");
    let tokenData = await fetchInfo();
    console.timeEnd("Time taken to fetch info from the rpc node");
    let csv = "Token Address,Owner,Name,Version,Details,Symbol,Granularity,Total Supply,Transfers Frozen,Minting Frozen,Controller,Investor count,Latest Checkpoint,Modules Attached (PermissionManager),Modules Attached (TransferManager),Modules Attached (STO),Modules Attached (Checkpoint),Modules Attached (Burn)\n";
    for (let i = 0; i < token2Addresses.length; i++) {
        csv = csv + token2Addresses[i] + ",";
        for(let j = 0; j < 2; j++) {
            csv = csv + tokenData[i*18 + j].toString().replace(/(\r\n|\n|\r|,)/gm, "") + ",";
        }
        csv = csv + tokenData[i*18 + 2][0] + "." + tokenData[i*18 + 2][1] + "." + tokenData[i*18 + 2][2] + ",";
        for(let j = 3; j < 9; j++) {
            csv = csv + tokenData[i*18 + j].toString().replace(/(\r\n|\n|\r|,)/gm, "") + ",";
        }
        if (tokenData[i*18 + 9]) {
            csv = csv + tokenData[i*18 + 9] + " Controller disabled,";
        } else {
            csv = csv + tokenData[i*18 + 10] + ",";
        }
        for(let j = 11; j < 13; j++) {
            csv = csv + tokenData[i*18 + j] + ",";
        }
        for(let j = 13; j < 17; j++) {
            csv = csv + tokenData[i*18 + j].length + ",";
        }
        csv = csv + tokenData[i*18 + 17].length + "\n";
    }
    for (let i = token2Addresses.length; i < token2Addresses.length + token3Addresses.length; i++) {
        csv = csv + token3Addresses[i - token2Addresses.length] + ",";
        for(let j = 0; j < 2; j++) {
            csv = csv + tokenData[i*18 + j].toString().replace(/(\r\n|\n|\r|,)/gm, "") + ",";
        }
        csv = csv + tokenData[i*18 + 2][0] + "." + tokenData[i*18 + 2][1] + "." + tokenData[i*18 + 2][2] + ",";
        for(let j = 3; j < 9; j++) {
            csv = csv + tokenData[i*18 + j].toString().replace(/(\r\n|\n|\r|,)/gm, "") + ",";
        }
        if (tokenData[i*18 + 9]) {
            csv = csv + tokenData[i*18 + 9] + " Controller disabled,";
        } else {
            csv = csv + tokenData[i*18 + 10] + ",";
        }
        for(let j = 11; j < 13; j++) {
            csv = csv + tokenData[i*18 + j] + ",";
        }
        for(let j = 13; j < 17; j++) {
            csv = csv + tokenData[i*18 + j].length + ",";
        }
        csv = csv + tokenData[i*18 + 17].length + "\n";
    }
    let fileName = "tokenInfo-" + new Date().getTime() + ".csv";
    fs.writeFile(fileName, csv, (err) => {
    if (err) console.log(err);
        console.log("Successfully Written to", fileName);
    });
}

async function fetchInfo() {
    let calls = [];
    let batch = [];
    batch.push(new web3.BatchRequest());
    for (let i = 0; i < token2Addresses.length; i++) {
        let token = new web3.eth.Contract(securityToken2ABI, token2Addresses[i]);
        calls.push(token.methods.owner().call);
        calls.push(token.methods.name().call);
        calls.push(token.methods.getVersion().call);
        calls.push(token.methods.tokenDetails().call);
        calls.push(token.methods.symbol().call);
        calls.push(token.methods.granularity().call);
        calls.push(token.methods.totalSupply().call);
        calls.push(token.methods.transfersFrozen().call);
        calls.push(token.methods.mintingFrozen().call);
        calls.push(token.methods.controllerDisabled().call);
        calls.push(token.methods.controller().call);
        calls.push(token.methods.getInvestorCount().call);
        calls.push(token.methods.currentCheckpointId().call);
        calls.push(token.methods.getModulesByType(1).call);
        calls.push(token.methods.getModulesByType(2).call);
        calls.push(token.methods.getModulesByType(3).call);
        calls.push(token.methods.getModulesByType(4).call);
        calls.push(token.methods.getModulesByType(5).call);
    }
    for (let i = 0; i < token3Addresses.length; i++) {
        let token = new web3.eth.Contract(securityToken3ABI, token3Addresses[i]);
        calls.push(token.methods.owner().call);
        calls.push(token.methods.name().call);
        calls.push(token.methods.getVersion().call);
        calls.push(token.methods.tokenDetails().call);
        calls.push(token.methods.symbol().call);
        calls.push(token.methods.granularity().call);
        calls.push(token.methods.totalSupply().call);
        calls.push(token.methods.transfersFrozen().call);
        calls.push(token.methods.isIssuable().call);
        calls.push(token.methods.controllerDisabled().call);
        calls.push(token.methods.controller().call);
        calls.push(token.methods.getInvestorCount().call);
        calls.push(token.methods.currentCheckpointId().call);
        calls.push(token.methods.getModulesByType(1).call);
        calls.push(token.methods.getModulesByType(2).call);
        calls.push(token.methods.getModulesByType(3).call);
        calls.push(token.methods.getModulesByType(4).call);
        calls.push(token.methods.getModulesByType(5).call);
    }
    let promises = calls.map(call => {
        return new Promise((res, rej) => {
            let req = call.request((err, data) => {
                if(err) rej(err);
                else res(data)
            });
            batch[batch.length - 1].add(req);
            if (batch[batch.length - 1].requests.length >= 2000) {
                batch[batch.length - 1].execute();
                batch.push(new web3.BatchRequest());
            }
        })
    })
    console.log("Total web3 calls:", calls.length);
    batch[batch.length - 1].execute();
    return Promise.all(promises);
}

async function getLogsFromEtherscan(_address, _fromBlock, _toBlock, _eventSignature) {
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

web3.eth.net.getId().then((chainId) => {
    if (chainId == 1) {  //Mainnet
        securityTokenRegistryAddress = "0x240f9f86b1465bf1b8eb29bc88cbf65573dfdd97";
        urlDomain = 'api';
    } else if (chainId == 42) {  //Kovan
        securityTokenRegistryAddress = "0x91110c2f67e2881a8540417be9eadf5bc9f2f248";
        urlDomain = 'api-kovan';
    } else {
        console.log('Invalid network');
        return;
    }
    getTokens();
});
