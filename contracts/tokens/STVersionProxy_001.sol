pragma solidity ^0.4.18;

import './SecurityToken.sol';
import '../SecurityTokenRegistrar.sol';
import '../interfaces/ISTProxy.sol';

contract STVersionProxy_001 is ISTProxy {

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails)
  public
  returns (address)
  {
    address newSecurityTokenAddress = new SecurityToken(
      _name,
      _symbol,
      _decimals,
      _tokenDetails,
      msg.sender
    );
    return newSecurityTokenAddress;
  }
}
