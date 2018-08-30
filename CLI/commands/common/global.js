const Web3 = require('web3');

function getGasPrice (networkId) {
    let gasPrice;
    switch (networkId) {
      case 1: //Mainnet
        gasPrice = 4000000000;
        break;
      case 3: //Ropsten
        gasPrice = 50000000000;
        break;
      case 15: //Ganache
        gasPrice = 50000000000;
        break;
      case 42: //Kovan
        gasPrice = 50000000000;
        break;
      default:
        throw new Error('Network ID not identified');
    }

    return gasPrice;
}
module.exports = {
    initialize: async function (remoteNetwork) {
      if (typeof web3 === 'undefined' || typeof Issuer === 'undefined' || typeof defaultGasPrice === 'undefined') {
        if (typeof remoteNetwork !== 'undefined') {
          web3 = new Web3(new Web3.providers.HttpProvider(`https://${remoteNetwork}.infura.io/`));
          let privKey = require('fs').readFileSync('./privKey').toString();
          Issuer = await web3.eth.accounts.privateKeyToAccount("0x" + privKey);
        } else {
          web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
          let accounts = await web3.eth.getAccounts();
          Issuer = {
            address: accounts[0],
            privateKey: require('fs').readFileSync('./privKeyLocal').toString()
          };
        }
        defaultGasPrice = getGasPrice(await web3.eth.net.getId());
      }
    }
};