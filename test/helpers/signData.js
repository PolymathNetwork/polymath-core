const Web3 = require("web3");
let BN = Web3.utils.BN;

function getSignSTMData(tmAddress, nonce, validFrom, expiry, fromAddress, toAddress, amount, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'uint256', v: new BN(nonce)}, {t: 'uint256', v: new BN(validFrom)}, {t: 'uint256', v: new BN(expiry)}, {t: 'address', v: fromAddress}, {t: 'address', v: toAddress}, {t: 'uint256', v: new BN(amount)});
    let signature = (web3.eth.accounts.sign(hash, pk)).signature;
    let data = web3.eth.abi.encodeParameters(['address', 'uint256', 'uint256', 'uint256', 'bytes'], [tmAddress, new BN(nonce).toString(), new BN(validFrom).toString(), new BN(expiry).toString(), signature]);
    return data;
}

function getSignGTMData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'address', v: investorAddress}, {t: 'uint256', v: new BN(fromTime)}, {t: 'uint256', v: new BN(toTime)}, {t: 'uint256', v: new BN(expiryTime)}, {t: 'uint256', v: new BN(validFrom)}, {t: 'uint256', v: new BN(validTo)}, {t: 'uint256', v: new BN(nonce)});
    let signature = (web3.eth.accounts.sign(hash, pk));
    return signature.signature;
}

function getSignGTMTransferData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk) {
    let hash = web3.utils.soliditySha3({t: 'address', v: tmAddress}, {t: 'address', v: investorAddress}, {t: 'uint256', v: new BN(fromTime)}, {t: 'uint256', v: new BN(toTime)}, {t: 'uint256', v: new BN(expiryTime)}, {t: 'uint256', v: new BN(validFrom)}, {t: 'uint256', v: new BN(validTo)}, {t: 'uint256', v: new BN(nonce)});
    let signature = (web3.eth.accounts.sign(hash, pk)).signature;
    let packedData = web3.eth.abi.encodeParameters(['address', 'uint256', 'uint256', 'uint256', 'bytes'], [investorAddress, new BN(fromTime).toString(), new BN(toTime).toString(), new BN(expiryTime).toString(), signature]);
    let data = web3.eth.abi.encodeParameters(['address', 'uint256', 'uint256', 'uint256', 'bytes'], [tmAddress, new BN(nonce).toString(), new BN(validFrom).toString(), new BN(validTo).toString(), packedData]);
    return data;
}

module.exports = {
    getSignSTMData,
    getSignGTMData,
    getSignGTMTransferData
};
