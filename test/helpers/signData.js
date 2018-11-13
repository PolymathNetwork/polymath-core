const ethers = require("ethers");
const utils = ethers.utils;
const ethUtil = require("ethereumjs-util");

//this, _investor, _fromTime, _toTime, _validTo
function signData (tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo, pk) {
    let packedData = utils
        .solidityKeccak256(
            ["address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "uint256"],
            [tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo]
        )
        .slice(2);
    packedData = new Buffer(packedData, "hex");
    packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
    packedData = web3.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });
    return ethUtil.ecsign(new Buffer(packedData.slice(2), "hex"), new Buffer(pk, "hex"));
}

// sign data for verify tranfer function
function signDataVerifyTransfer (tmAddress, fromAddress, toAddress, amount, account) {
    let packedData = utils
        .solidityKeccak256(
            ["address", "address", "address", "uint256"],
            [tmAddress, fromAddress, toAddress, amount]
        )
        .slice(2);
    packedData = new Buffer(packedData, "hex");
    packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
    packedData = web3.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });

    return web3.eth.sign(account, packedData);
}

// test
function signDataVerifyTransfer2 (tmAddress, fromAddress, toAddress, amount, pk) {
    let packedData = utils
        .solidityKeccak256(
            ["address", "address", "address", "uint256"],
            [tmAddress, fromAddress, toAddress, amount]
        )
        .slice(2);
    packedData = new Buffer(packedData, "hex");
    packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
    packedData = web3.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });

    let wallet = new ethers.Wallet(pk.indexOf('0x') === 0 ? pk : '0x' + pk);

    return wallet.signMessage(packedData);
}

module.exports = {
    signData, signDataVerifyTransfer
};
