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
      return "0x97dc33d7f40863c09444f8c110e7a446ca209470";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8cd431b23415d132b82d44252c69e3458eec1229";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0xcf82d3f2abdf777f559e98d85f976283595f0d30";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x854b179252b51d2ee9abf50800cd52f96ec9c7d3";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x6487a0c9cc1c5f0d2ff70f0252e4bd2b8e1d014b";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x00d4671f8c00fcfc2256e008242f07c1428b5836";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xc47a7bd89c0ca065622b9f96a275e385642d2593";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x4f8de4146250f60075a8357243a1b67c5052d80c";
    else if(SELECTED_NETWORK == NETWORKS.KOVAN)
      return "0x30e2c3fa3297808a2e9f176be6cc587cb76259c4";
  },

};
