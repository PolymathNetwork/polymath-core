var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xbb18aaa2af79ab4977d751292c528ac936b63265";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xd6c985d538beeb8ee2642761ca8cdee15e2c604d";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xcf3491244098c1a27eec3f0ea26e25ccccacbfe9";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },

};
