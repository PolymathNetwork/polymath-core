var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x07ddbce0c195da96e62e4104c9aee308f39528d0";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xf230cdb121cc283cb521dd4243ebfa70031e1eff";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x542226494324c90f992f49b106dda02bba3918e0";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },

};
