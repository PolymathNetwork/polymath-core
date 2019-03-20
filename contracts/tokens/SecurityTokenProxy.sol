pragma solidity ^0.5.0;

import "../proxy/OwnedUpgradeabilityProxy.sol";
import "./OZStorage.sol";
import "./SecurityTokenStorage.sol";

/**
 * @title USDTiered STO module Proxy
 */
contract SecurityTokenProxy is OZStorage, SecurityTokenStorage, OwnedUpgradeabilityProxy {

    /**
     * @notice constructor
     * @param _ERC20name Name of the SecurityToken
     * @param _ERC20symbol Symbol of the Token
     * @param _ERC20decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     */
    constructor(
        string memory _ERC20name,
        string memory _ERC20symbol,
        uint8 _ERC20decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry
    )
        public
        OZStorage(_ERC20name, _ERC20symbol, _ERC20decimals)
    {
        //Set storage variables - NB implementation not yet set
        require(_polymathRegistry != address(0), "Invalid Address");
        polymathRegistry = _polymathRegistry;
        tokenDetails = _tokenDetails;
        granularity = _granularity;
        _owner = msg.sender;
    }

}
