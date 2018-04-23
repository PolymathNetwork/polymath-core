const ethers = require('ethers');
const utils = ethers.utils;
const ethUtil = require('ethereumjs-util');

//this, _investor, _fromTime, _toTime, _validTo
function signData(tmAddress, investorAddress, fromTime, toTime, validFrom, validTo, pk) {
// let nonce = 1;//Number(Math.random().toString().slice(2));
  let accreditedBytes = "0x00";
  if (accredited) {
    accreditedBytes = "0x01";
  }
  // let nonce = 1;
  let packedData = utils.solidityKeccak256(
      [ "address", "address", "uint256", "uint256", "uint256", "uint256" ],
      [ tmAddress, investorAddress, fromTime, toTime, validFrom, validTo ]
    ).slice(2);
  packedData = new Buffer(packedData, 'hex');
  packedData = Buffer.concat([
    new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`),
    packedData]);
  packedData = web3.sha3(`0x${packedData.toString('hex')}`, { encoding: 'hex' });
  return ethUtil.ecsign(
    new Buffer(packedData.slice(2), 'hex'),
    new Buffer(pk, 'hex'));
}

module.exports = {
  signData
}
