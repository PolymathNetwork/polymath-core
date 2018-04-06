var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x364e1df7e20e1b741640c0a3232b4f57c5bb4edb";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x4c106007a7edd7e7155e1a0597c8160a9718d297";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x0deada0d3bb4adc0248d5c7b2141fc8e7d6e13b0";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },

};
