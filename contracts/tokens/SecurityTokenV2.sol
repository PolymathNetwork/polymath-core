pragma solidity ^0.4.21;

import "./SecurityToken.sol";


/**
* @title SecurityToken V2
* @notice Mockup of how an upgrade of SecurityToken would look like
*/
contract SecurityTokenV2 is SecurityToken {
    bytes32 public securityTokenVersion = "0.0.2";

    function SecurityTokenV2(
        string _name,
        string _symbol,
        uint8 _decimals,
        bytes32 _tokenDetails,
        address _securityTokenRegistry
    )
    public
    SecurityToken(
    _name,
    _symbol,
    _decimals,
    _tokenDetails,
    _securityTokenRegistry)
    {
    }
}
