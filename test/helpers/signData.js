const Web3 = require("web3");
//const sigUtil = require('eth-sig-util')
let BN = Web3.utils.BN;

function getSignSTMData(tmAddress, nonce, validFrom, expiry, fromAddress, toAddress, amount, pk) {
    let hash = web3.utils.soliditySha3({
        t: 'address',
        v: tmAddress
    }, {
        t: 'uint256',
        v: new BN(nonce)
    }, {
        t: 'uint256',
        v: new BN(validFrom)
    }, {
        t: 'uint256',
        v: new BN(expiry)
    }, {
        t: 'address',
        v: fromAddress
    }, {
        t: 'address',
        v: toAddress
    }, {
        t: 'uint256',
        v: new BN(amount)
    });
    let signature = (web3.eth.accounts.sign(hash, pk)).signature;
    let data = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint256', 'uint256', 'bytes'], 
        [tmAddress, new BN(nonce).toString(), new BN(validFrom).toString(), new BN(expiry).toString(), signature]
    );
    return data;
}

async function getFreezeIssuanceAck(stAddress, from) {
    const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ],
            Acknowledgment: [
                { name: 'text', type: 'string' }
            ],
        },
        primaryType: 'Acknowledgment',
        domain: {
            name: 'Polymath',
            chainId: 1,
            verifyingContract: stAddress
        },
        message: {
            text: 'I acknowledge that freezing Issuance is a permanent and irrevocable change',
        },
    };
    const result = await new Promise((resolve, reject) => { 
        web3.currentProvider.send(
            {
                method: 'eth_signTypedData',
                params: [from, typedData]
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result.result);
            }
        );
    });
    // console.log('signed by', from);
    // const recovered = sigUtil.recoverTypedSignature({
    //     data: typedData,
    //     sig: result 
    // })
    // console.log('recovered address', recovered);
    return result;
}

async function getDisableControllerAck(stAddress, from) {
    const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ],
            Acknowledgment: [
                { name: 'text', type: 'string' }
            ],
        },
        primaryType: 'Acknowledgment',
        domain: {
            name: 'Polymath',
            chainId: 1,
            verifyingContract: stAddress
        },
        message: {
            text: 'I acknowledge that disabling controller is a permanent and irrevocable change',
        },
    };
    const result = await new Promise((resolve, reject) => { 
        web3.currentProvider.send(
            {
                method: 'eth_signTypedData',
                params: [from, typedData]
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result.result);
            }
        );
    });
    return result;
}

function getSignGTMData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk) {
    let hash = web3.utils.soliditySha3({
        t: 'address',
        v: tmAddress
    }, {
        t: 'address',
        v: investorAddress
    }, {
        t: 'uint256',
        v: new BN(fromTime)
    }, {
        t: 'uint256',
        v: new BN(toTime)
    }, {
        t: 'uint256',
        v: new BN(expiryTime)
    }, {
        t: 'uint256',
        v: new BN(validFrom)
    }, {
        t: 'uint256',
        v: new BN(validTo)
    }, {
        t: 'uint256',
        v: new BN(nonce)
    });
    let signature = (web3.eth.accounts.sign(hash, pk));
    return signature.signature;
}

function getSignGTMTransferData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk) {
    let signature = getMultiSignGTMData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk);
    let packedData = web3.eth.abi.encodeParameters(
        ['address[]', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'], 
        [investorAddress, fromTime, toTime, expiryTime, signature]
    );
    let data = web3.eth.abi.encodeParameters(
        ['address', 'uint256', 'uint256', 'uint256', 'bytes'], 
        [tmAddress, new BN(nonce).toString(), new BN(validFrom).toString(), new BN(validTo).toString(), packedData]
    );
    return data;
}

function getMultiSignGTMData(tmAddress, investorAddress, fromTime, toTime, expiryTime, validFrom, validTo, nonce, pk) {
    let hash = web3.utils.soliditySha3({
        t: 'address',
        v: tmAddress
    }, {
        t: 'address[]',
        v: investorAddress
    }, {
        t: 'uint256[]',
        v: fromTime
    }, {
        t: 'uint256[]',
        v: toTime
    }, {
        t: 'uint256[]',
        v: expiryTime
    }, {
        t: 'uint256',
        v: new BN(validFrom)
    }, {
        t: 'uint256',
        v: new BN(validTo)
    }, {
        t: 'uint256',
        v: new BN(nonce)
    });
    let signature = (web3.eth.accounts.sign(hash, pk)).signature;
    return signature;
}

module.exports = {
    getSignSTMData,
    getSignGTMData,
    getSignGTMTransferData,
    getMultiSignGTMData,
    getFreezeIssuanceAck,
    getDisableControllerAck
};