const Web3 = require("web3");

if (typeof web3 !== "undefined") {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let startTime = process.argv.slice(2)[0];
let endTime = process.argv.slice(2)[1];
let cap = process.argv.slice(2)[2];
let rate = process.argv.slice(2)[3];
let wallet = process.argv.slice(2)[4];

let bytesSTO = web3.eth.abi.encodeFunctionCall(
    {
        name: "configure",
        type: "function",
        inputs: [
            {
                type: "uint256",
                name: "_startTime"
            },
            {
                type: "uint256",
                name: "_endTime"
            },
            {
                type: "uint256",
                name: "_cap"
            },
            {
                type: "uint256",
                name: "_rate"
            },
            {
                type: "uint8",
                name: "_fundRaiseType"
            },
            {
                type: "address",
                name: "_polyToken"
            },
            {
                type: "address",
                name: "_fundsReceiver"
            }
        ]
    },
    [startTime, endTime, web3.utils.toWei(cap, "ether"), rate, 0, 0, wallet]
);

console.log(bytesSTO);
