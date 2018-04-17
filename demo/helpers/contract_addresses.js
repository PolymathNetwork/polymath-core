var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x8942f67e0ab0a7bf32a8c975c3eca3efb4cc1164";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x0abeafae9333f7dc64959914f67765edee5fd05f";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x720d6edf211fff831537514c3aa6ce3ea882e8e0";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8e736d9caeb9eb9b7a766c196fbb01eb53344e81";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xdd398df235815e879e661d9f129eba83d4a2ea74";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x423105526255db03c36fd763c982dad96b95d17e";
  },

};
