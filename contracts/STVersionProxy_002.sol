pragma solidity ^0.4.18;

import './SecurityTokenV2.sol';
import './SecurityTokenRegistrar.sol';
import './interfaces/ISTProxy.sol';

contract STVersionProxy_002 is ISTProxy{

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _moduleRegistry)
  public returns (address){
    address newSecurityTokenAddress = new SecurityTokenV2(
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
