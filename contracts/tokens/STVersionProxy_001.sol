pragma solidity ^0.4.18;

import './SecurityToken.sol';
import '../SecurityTokenRegistrar.sol';
import '../interfaces/ISTProxy.sol';

contract STVersionProxy_001 is ISTProxy {

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _moduleRegistry)
  public 
  returns (address) 
  {
    address newSecurityTokenAddress = new SecurityToken(
      _name,
      _symbol,
      _decimals,
      _tokenDetails,
      _moduleRegistry,
      msg.sender
    );
    return newSecurityTokenAddress;
  }
}
