var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x9f7887b98eb8427e58baf880659208ca667cc62d";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x59a3d5e99eeff8d92a502d9dde044597b1687bb9";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x21d38c82b32e9f504543d6a871c079f367aa12d4";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "";
  },

};
