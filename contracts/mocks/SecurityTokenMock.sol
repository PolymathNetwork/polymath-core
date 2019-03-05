pragma solidity ^0.5.0;

import "../tokens/SecurityToken.sol";

/**
 * @title Security Token contract
 * @notice SecurityToken is an ERC1400 token with added capabilities:
 * @notice - Implements the ERC1400 Interface
 * @notice - Transfers are restricted
 * @notice - Modules can be attached to it to control its behaviour
 * @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
 * @notice - ST does not inherit from ISecurityToken due to:
 * @notice - https://github.com/ethereum/solidity/issues/4847
 */
contract SecurityTokenMock is SecurityToken {
    
    /**
     * @notice constructor 
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     * @param _delegate Contract address of the delegate
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry,
        address _delegate
    ) 
        public
        SecurityToken(_name, _symbol, _decimals, _granularity, _tokenDetails, _polymathRegistry,_delegate)
    {
        securityTokenVersion = SemanticVersion(2, 2, 0);
    }

    
}
