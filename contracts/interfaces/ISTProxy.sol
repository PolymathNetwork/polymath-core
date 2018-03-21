pragma solidity ^0.4.18;

contract ISTProxy {

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _moduleRegistry)
  public returns (address);
}
