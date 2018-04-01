let _GANACHE_CONTRACTS = true;

module.exports = {
  tickerRegistryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0xf207b817475c646684dd844673401f2d79823999";
    else
      return "";
  },
  securityTokenRegistryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0x2ae556fcab3366cebc7af880582cfe6970e8f434";
    else
      return "";
  },
  cappedSTOFactoryAddress: function() {
    if(_GANACHE_CONTRACTS)
      return "0xf928eda0542238ef2999e8931d45a7a3371cdd2d";
    else
      return "";
  },

};
