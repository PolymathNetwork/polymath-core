pragma solidity 0.5.8;

import "../proxy/OwnedUpgradeabilityProxy.sol";
import "./OZStorage.sol";
import "./SecurityTokenStorage.sol";

/**
 * @title USDTiered STO module Proxy
 */
contract SecurityTokenProxy is OZStorage, SecurityTokenStorage, OwnedUpgradeabilityProxy {

    /**
     * @notice constructor
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry
    )
        public
    {
        //Set storage variables - NB implementation not yet set
        require(_polymathRegistry != address(0), "Invalid Address");
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        polymathRegistry = IPolymathRegistry(_polymathRegistry);
        tokenDetails = _tokenDetails;
        granularity = _granularity;
        _owner = msg.sender;
    }

}
