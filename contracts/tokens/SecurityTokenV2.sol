pragma solidity ^0.4.18;

import './SecurityToken.sol';

/**
* @title SecurityToken
* @notice SecurityToken is an ERC20 token with added capabilities:
* - Transfers are restricted
* - Modules can be attached to it to control its behaviour
* - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
*/
contract SecurityTokenV2 is SecurityToken {
    bytes32 public securityTokenVersion = "0.0.2";

    function SecurityTokenV2(
        string _name,
        string _symbol,
        uint8 _decimals,
        bytes32 _tokenDetails,
        address _owner
    )
    public
    SecurityToken(
      _name,
      _symbol,
      _decimals,
      _tokenDetails,
      _owner)
    {
    }
}
