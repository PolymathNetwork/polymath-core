let _GANACHE_CONTRACTS = true;

module.exports = {
  tickerRegistryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0x3f7923b811649bdde1aa2f7e73eefe3079343c5e";
    else
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0x4d6e392df8085ee00f0d9fd34a379496595eb838";
    else
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0x5812213fd5126f742ac672bc5de9dffb9dbdd6a2";
    else
      return "";
  },

};
