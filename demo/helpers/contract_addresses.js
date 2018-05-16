var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
  KOVAN:42
};
var SELECTED_NETWORK = NETWORKS.KOVAN;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xf4cc01371a5db9269be5ea7e1882c21c3e110842";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8cd431b23415d132b82d44252c69e3458eec1229";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x52ef6665ca74b40cfd17b26f329de0fa5cee3b5a";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xd8c28670bfb981279fa6d44c3f87c8c7efc69e8e";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x6487a0c9cc1c5f0d2ff70f0252e4bd2b8e1d014b";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x7bf6e63c2326d27340b21fe3a5d9187af915e87d";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x0a584935cb274d4d9e9bf5b698775cad9833c3a4";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x4f8de4146250f60075a8357243a1b67c5052d80c";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x5132e6ca98f7fa3d3393bab0f5eb8bad010f51ea";
  },

};
