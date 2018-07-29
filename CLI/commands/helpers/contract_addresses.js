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
      return "0x33905f8f5021b258e79e0a4d4ce44e396742bf46"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x2f279fde5b3a9d4570e21ccc6d67a6962b134902"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x5ad2162dea12e9074641cb3d729102e13d095aa1"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  usdTieredSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xd4eb00b4e222ae13b657edb3e29e1d2df090c1d3"; // Updated to poly_oracle deployment
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  polyTokenAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xb06d72a24df50d4e2cac133b320c5e7de3ef94cb";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).networks[SELECTED_NETWORK].address;
  },
  etherDividendCheckpointFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x8e34a955dcdd6c0e4a88fb21af562b7db0b20100";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  erc20DividendCheckpointFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x9d8778fc5b4d7b97a74dcfee6661d14709cf5180";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  }
};
