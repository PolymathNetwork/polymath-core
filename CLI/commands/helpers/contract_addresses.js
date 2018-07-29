var NETWORKS = {
  GANACHE: 15,
  MAINNET: 1,
  ROPSTEN: 3,
  KOVAN:   42
};
var SELECTED_NETWORK = NETWORKS.KOVAN;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xc9af1d88fe48c8a6aa8677a29a89b0a6ae78f5a8";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xced6e4ec2ac5425743bf4edf4d4e476120b8fc72";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xde4f3cfb6b214e60c4e69e6dfc95ede3c4e3d709";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  polyTokenAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xb06d72a24df50d4e2cac133b320c5e7de3ef94cb";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).networks[SELECTED_NETWORK].address;
  },
  etherDividendCheckpointFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x870a07d45b0f4c5653fc29a4cb0697a01e0224b1";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  erc20DividendCheckpointFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x7e823f5df6ed1bb6cc005c692febc6aedf3b8889";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  }
};
