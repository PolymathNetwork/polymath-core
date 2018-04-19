var NETWORKS = {
  GANACHE: 0,
  MAINNET: 1,
  ROPSTEN: 3,
};
var SELECTED_NETWORK = NETWORKS.GANACHE;

module.exports = {
  tickerRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x590f31d32034b608b833edbbdec509d14db35ffa";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x0abeafae9333f7dc64959914f67765edee5fd05f";
  },
  securityTokenRegistryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0x878448491e1f7f6d591852fc77323732b2ee7a04";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x8e736d9caeb9eb9b7a766c196fbb01eb53344e81";
  },
  cappedSTOFactoryAddress: function() {
    if(SELECTED_NETWORK == NETWORKS.GANACHE)
      return "0xed009428d0f806b4223645266a22556458155338";
    else if(SELECTED_NETWORK == NETWORKS.ROPSTEN)
      return "0x423105526255db03c36fd763c982dad96b95d17e";
  },

};
