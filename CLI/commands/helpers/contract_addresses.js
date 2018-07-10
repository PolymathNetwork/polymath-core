var NETWORKS = {
  GANACHE: 15,
  MAINNET: 1,
  ROPSTEN: 3,
  KOVAN:   42
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  securityTokenRegistryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).networks[SELECTED_NETWORK].address;
  },
  cappedSTOFactoryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  usdTieredSTOFactoryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  polyTokenAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xd8568c6535f1bbd82f84d981bf8ea5ca2336052e";
    else
      return JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).networks[SELECTED_NETWORK].address;
  },
  etherDividendCheckpointFactoryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  },
  erc20DividendCheckpointFactoryAddress: function() {
    return JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpointFactory.json').toString()).networks[SELECTED_NETWORK].address;
  }
};
