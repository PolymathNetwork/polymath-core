pragma solidity ^0.4.24;

import "./SecurityToken.sol";


/**
* @title SecurityToken V2
* @notice Mockup of how an upgrade of SecurityToken would look like
*/
contract SecurityTokenV2 is SecurityToken {
    bytes32 public securityTokenVersion = "0.0.2";

     /**
     * @notice Constructor
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored offchain (IPFS hash)
     * @param _securityTokenRegistry Contract address of the security token registry
     */
    constructor (
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string _tokenDetails,
        address _securityTokenRegistry
    )
    public
    SecurityToken(
    _name,
    _symbol,
    _decimals,
    _granularity,
    _tokenDetails,
    _securityTokenRegistry)
    {
    }
}
