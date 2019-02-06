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
    console.log("PackedData 1: " + packedData);
    packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
    packedData = web3.utils.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });
    console.log("PackedData 2: " + packedData);
    return ethUtil.ecsign(new Buffer(packedData.slice(2), "hex"), new Buffer(pk, "hex"));
}

function getSignSTMData(tmAddress, nonce, expiry, fromAddress, toAddress, amount, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'uint256', v: new BN(nonce)}, {t: 'uint256', v: new BN(expiry)}, {t: 'address', v: fromAddress}, {t: 'address', v: toAddress}, {t: 'uint256', v: new BN(amount)});
    let signature = (web3.eth.accounts.sign(hash, pk)).signature;
    let data = web3.eth.abi.encodeParameters(['address', 'uint256', 'uint256', 'bytes'], [tmAddress, new BN(nonce).toString(), new BN(expiry).toString(), signature]);
    return data;
}

function getSignGTMData(tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, accredited, validFrom, validTo, nonce, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'address', v: investorAddress}, {t: 'uint256', v: new BN(fromTime)}, {t: 'uint256', v: new BN(toTime)}, {t: 'uint256', v: new BN(expiryTime)}, {t: 'bool', v: restricted}, {t: 'bool', v: accredited}, {t: 'uint256', v: new BN(validFrom)}, {t: 'uint256', v: new BN(validTo)}, {t: 'uint256', v: new BN(nonce)});
    let signature = (web3.eth.accounts.sign(hash, pk));
    return signature.signature;
}

module.exports = {
    signData,
    getSignSTMData,
    getSignGTMData
};
