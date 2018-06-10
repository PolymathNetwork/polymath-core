var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
  KOVAN:42
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xd081231922797026d40d6164e4577ddc612854ef";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8cd431b23415d132b82d44252c69e3458eec1229";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xcf82d3f2abdf777f559e98d85f976283595f0d30";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xddc1cae1c8abd3e8c2d477a210c3173f08423347";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x6487a0c9cc1c5f0d2ff70f0252e4bd2b8e1d014b";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x00d4671f8c00fcfc2256e008242f07c1428b5836";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x422a90edf120287f0b71163a27f806b04b81c904";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x4f8de4146250f60075a8357243a1b67c5052d80c";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x30e2c3fa3297808a2e9f176be6cc587cb76259c4";
  },

};
