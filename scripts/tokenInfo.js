const Web3 = require("web3");
const fs = require("fs");
const async = require("async");
const path = require("path");
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/"));

const securityTokenRegistryABI = JSON.parse(require('fs').readFileSync('../build/contracts/SecurityTokenRegistry.json').toString()).abi;
const securityTokenABI = JSON.parse(require('fs').readFileSync('../build/contracts/SecurityToken.json').toString()).abi;
const generalTransferManagerABI = JSON.parse(require('fs').readFileSync('../build/contracts/GeneralTransferManager.json').toString()).abi;
const securityTokenRegistryAddress = "0xEf58491224958d978fACF55D2120c55A24516B98";
const securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);

async function getTokens() {
    let strEvents = await web3.eth.getPastLogs({fromBlock:'0x5C5C18', address:securityTokenRegistry.address, topics: ["0x2510d802a0818e71139a7680a6388bcffcd3fa686e02a0f7319488c5bdb38fcb"]});
    for (let i = 0; i < strEvents.length; i++) {
        let tokenAddress = '0x' + strEvents[i].topics[1].slice(26,66)
        try {
            await getInfo(tokenAddress);
        } catch(exception) {
            console.log('Failed to load info of', tokenAddress, exception);
        }
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
    let gtmEvents = await web3.eth.getPastLogs({fromBlock:'0x5C5C18', address:gtmRes.moduleAddress});
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

getTokens();
