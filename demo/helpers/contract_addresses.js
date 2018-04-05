var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xc34666b7e3d6408d16414319f37df05d3b13056b";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x556d1b38d2e9b78747e4ec35568783b6c635dc5d";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x41cd63dd19474cc3f07c83949165e1a0132bf79e";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },

};
