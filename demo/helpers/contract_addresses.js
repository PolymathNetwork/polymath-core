var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.ROPSTEN;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x9c6d96643165bb6d095a6558e8c5f382e510ae89";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x0abeafae9333f7dc64959914f67765edee5fd05f";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xe2789abc621d39817bccf7507296bba536c5cc1d";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8e736d9caeb9eb9b7a766c196fbb01eb53344e81";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x96d63dd0093d1a47dd94e92c612cb0f4c3b8280a";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x423105526255db03c36fd763c982dad96b95d17e";
  },

};
