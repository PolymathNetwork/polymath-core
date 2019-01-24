const ethers = require("ethers");
const utils = ethers.utils;
const ethUtil = require("ethereumjs-util");
const Web3 = require("web3");
let BN = Web3.utils.BN;

//this, _investor, _fromTime, _toTime, _validTo
function signData(tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo, nonce, pk) {
    let packedData = utils
        .solidityKeccak256(
            ["address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "uint256", "uint256"],
            [tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo, nonce]
        )
        .slice(2);
    packedData = new Buffer(packedData, "hex");
    packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
    packedData = web3.utils.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });
    return ethUtil.ecsign(new Buffer(packedData.slice(2), "hex"), new Buffer(pk, "hex"));
}

function getSignTMSig(tmAddress, fromAddress, toAddress, amount, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'address', v: fromAddress}, {t: 'address', v: toAddress}, {t: 'uint256', v: new BN(amount)});
    let sign = web3.eth.accounts.sign(hash, pk);
    return sign.signature;
}

module.exports = {
    signData,
    getSignTMSig
};
