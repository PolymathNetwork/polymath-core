var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xeed2b06e9ef10da0e03194ea398dda73da4bd74b";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x0abeafae9333f7dc64959914f67765edee5fd05f";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x8238d156a8d3398de0e012b40d404e5f1d7ea26e";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8e736d9caeb9eb9b7a766c196fbb01eb53344e81";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x3d2f52bc61d5df1260ac55fd6eefbdee7c388d68";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x423105526255db03c36fd763c982dad96b95d17e";
  },

};
